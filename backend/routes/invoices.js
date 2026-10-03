const express = require("express");
const router = express.Router();
const { query, transaction } = require("../db/pool");
const auth = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const TVA_RATES = [0, 7, 10, 14, 20];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const computeTotals = (items) => {
  let subtotal = 0;
  let tva = 0;
  for (const it of items) {
    const lineTotal = round2(it.quantity * it.unit_price * (1 - (it.discount || 0) / 100));
    subtotal += lineTotal;
    tva += round2(lineTotal * (it.tva_rate || 0) / 100);
  }
  return { subtotal: round2(subtotal), tva: round2(tva), total: round2(subtotal + tva) };
};

router.get("/", auth, async (req, res) => {
  try {
    const status = req.query.status;
    const params = [];
    let where = "WHERE i.user_id = $1";
    params.push(req.user.id);
    if (status) {
      params.push(status);
      where += ` AND i.status = $${params.length}`;
    }
    const result = await query(
      `SELECT i.*,
        COALESCE((SELECT json_agg(json_build_object(
          'id', ii.id, 'description', ii.description, 'quantity', ii.quantity,
          'unit_price', ii.unit_price, 'discount', ii.discount, 'tva_rate', ii.tva_rate,
          'total', ii.total) ORDER BY ii.id)
          FROM invoice_items ii WHERE ii.invoice_id = i.id), '[]') AS items
       FROM invoices i ${where} ORDER BY i.date DESC, i.id DESC`,
      params,
    );
    res.json({ invoices: result.rows });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ error: "Error fetching invoices" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*,
        COALESCE((SELECT json_agg(json_build_object(
          'id', ii.id, 'description', ii.description, 'quantity', ii.quantity,
          'unit_price', ii.unit_price, 'discount', ii.discount, 'tva_rate', ii.tva_rate,
          'total', ii.total) ORDER BY ii.id)
          FROM invoice_items ii WHERE ii.invoice_id = i.id), '[]') AS items
       FROM invoices i WHERE i.id = $1 AND i.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json({ invoice: result.rows[0] });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ error: "Error fetching invoice" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, customer_address, due_date, notes, payment_terms, items } = req.body;
    if (!customer_name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Customer name and at least one item are required" });
    }
    for (const it of items) {
      if (!it.description || !it.quantity || it.unit_price === undefined) {
        return res.status(400).json({ error: "Each item needs description, quantity and unit_price" });
      }
      if (it.tva_rate !== undefined && !TVA_RATES.includes(Number(it.tva_rate))) {
        return res.status(400).json({ error: `TVA rate must be one of: ${TVA_RATES.join(", ")}` });
      }
    }

    const created = await transaction(async (client) => {
      const year = new Date().getFullYear();
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS n FROM invoices WHERE user_id = $1 AND invoice_number LIKE $2`,
        [req.user.id, `INV-${year}-%`],
      );
      const nextNum = countResult.rows[0].n + 1;
      const invoiceNumber = `INV-${year}-${String(nextNum).padStart(4, "0")}`;

      const { subtotal, tva, total } = computeTotals(items);
      const invResult = await client.query(
        `INSERT INTO invoices (user_id, invoice_number, customer_name, customer_email, customer_phone, customer_address, due_date, subtotal, tva_amount, total, notes, payment_terms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [req.user.id, invoiceNumber, customer_name, customer_email || null, customer_phone || null, customer_address || null, due_date || null, subtotal, tva, total, notes || null, payment_terms || null],
      );
      const invoice = invResult.rows[0];

      for (const it of items) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount, tva_rate)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [invoice.id, it.product_id || null, it.description, it.quantity, it.unit_price, it.discount || 0, it.tva_rate !== undefined ? it.tva_rate : 20],
        );
      }
      return invoice;
    });

    res.status(201).json({ invoice: created });
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json({ error: "Error creating invoice" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const existing = await query("SELECT * FROM invoices WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (existing.rowCount === 0) return res.status(404).json({ error: "Invoice not found" });
    if (existing.rows[0].status === "paid") {
      return res.status(400).json({ error: "Paid invoices cannot be edited" });
    }

    const { customer_name, customer_email, customer_phone, customer_address, due_date, notes, payment_terms, status, items } = req.body;
    const updated = await transaction(async (client) => {
      const invResult = await client.query(
        `UPDATE invoices SET customer_name = COALESCE($3, customer_name),
          customer_email = COALESCE($4, customer_email),
          customer_phone = COALESCE($5, customer_phone),
          customer_address = COALESCE($6, customer_address),
          due_date = COALESCE($7, due_date),
          notes = COALESCE($8, notes),
          payment_terms = COALESCE($9, payment_terms),
          status = COALESCE($10, status),
          updated_at = NOW()
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [req.params.id, req.user.id, customer_name, customer_email, customer_phone, customer_address, due_date, notes, payment_terms, status],
      );
      const invoice = invResult.rows[0];

      if (Array.isArray(items)) {
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [invoice.id]);
        for (const it of items) {
          await client.query(
            `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount, tva_rate)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [invoice.id, it.product_id || null, it.description, it.quantity, it.unit_price, it.discount || 0, it.tva_rate !== undefined ? it.tva_rate : 20],
          );
        }
        const { subtotal, tva, total } = computeTotals(items);
        await client.query(
          "UPDATE invoices SET subtotal = $2, tva_amount = $3, total = $4, updated_at = NOW() WHERE id = $1",
          [invoice.id, subtotal, tva, total],
        );
        invoice.subtotal = subtotal;
        invoice.tva_amount = tva;
        invoice.total = total;
      }
      return invoice;
    });

    res.json({ invoice: updated });
  } catch (err) {
    console.error("Error updating invoice:", err);
    res.status(500).json({ error: "Error updating invoice" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await query("DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting invoice:", err);
    res.status(500).json({ error: "Error deleting invoice" });
  }
});

router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*,
        COALESCE((SELECT json_agg(json_build_object(
          'description', ii.description, 'quantity', ii.quantity,
          'unit_price', ii.unit_price, 'discount', ii.discount, 'tva_rate', ii.tva_rate,
          'total', ii.total) ORDER BY ii.id)
          FROM invoice_items ii WHERE ii.invoice_id = i.id), '[]') AS items
       FROM invoices i WHERE i.id = $1 AND i.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Invoice not found" });
    const inv = result.rows[0];

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${inv.invoice_number}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("FACTURE", { align: "right" });
    doc.fontSize(10).text(inv.invoice_number, { align: "right" });
    doc.moveDown();
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString("fr-FR")}`);
    if (inv.due_date) doc.text(`Échéance: ${new Date(inv.due_date).toLocaleDateString("fr-FR")}`);
    doc.moveDown();
    doc.fontSize(12).text("Client:", { underline: true });
    doc.fontSize(10).text(inv.customer_name);
    if (inv.customer_email) doc.text(inv.customer_email);
    if (inv.customer_phone) doc.text(inv.customer_phone);
    if (inv.customer_address) doc.text(inv.customer_address);
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text("Description", 50, tableTop);
    doc.text("Qté", 320, tableTop, { width: 40, align: "right" });
    doc.text("Prix unit.", 370, tableTop, { width: 60, align: "right" });
    doc.text("TVA", 440, tableTop, { width: 40, align: "right" });
    doc.text("Total", 490, tableTop, { width: 60, align: "right" });
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    for (const item of inv.items) {
      doc.text(item.description, 50, y, { width: 260 });
      doc.text(String(item.quantity), 320, y, { width: 40, align: "right" });
      doc.text(`${Number(item.unit_price).toFixed(2)} MAD`, 370, y, { width: 60, align: "right" });
      doc.text(`${item.tva_rate}%`, 440, y, { width: 40, align: "right" });
      doc.text(`${Number(item.total).toFixed(2)} MAD`, 490, y, { width: 60, align: "right" });
      y += 20;
    }

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    doc.text(`Sous-total: ${Number(inv.subtotal).toFixed(2)} MAD`, 370, y, { width: 180, align: "right" });
    y += 20;
    doc.text(`TVA: ${Number(inv.tva_amount).toFixed(2)} MAD`, 370, y, { width: 180, align: "right" });
    y += 20;
    doc.fontSize(12).text(`Total: ${Number(inv.total).toFixed(2)} MAD`, 370, y, { width: 180, align: "right" });

    if (inv.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text("Notes:", { underline: true });
      doc.text(inv.notes);
    }

    doc.moveDown(2);
    doc.fontSize(8).text(`Statut: ${inv.status}`, 50, 750);
    doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 50, 765);

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ error: "Error generating PDF" });
  }
});

module.exports = router;
