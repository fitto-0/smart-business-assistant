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
    const lineTotal = round2(
      it.quantity * it.unit_price * (1 - (it.discount || 0) / 100),
    );
    subtotal += lineTotal;
    tva += round2((lineTotal * (it.tva_rate || 0)) / 100);
  }
  return {
    subtotal: round2(subtotal),
    tva: round2(tva),
    total: round2(subtotal + tva),
  };
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
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Invoice not found" });
    res.json({ invoice: result.rows[0] });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ error: "Error fetching invoice" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      due_date,
      notes,
      payment_terms,
      items,
    } = req.body;
    if (!customer_name || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Customer name and at least one item are required" });
    }
    for (const it of items) {
      if (!it.description || !it.quantity || it.unit_price === undefined) {
        return res
          .status(400)
          .json({
            error: "Each item needs description, quantity and unit_price",
          });
      }
      if (
        it.tva_rate !== undefined &&
        !TVA_RATES.includes(Number(it.tva_rate))
      ) {
        return res
          .status(400)
          .json({ error: `TVA rate must be one of: ${TVA_RATES.join(", ")}` });
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
        [
          req.user.id,
          invoiceNumber,
          customer_name,
          customer_email || null,
          customer_phone || null,
          customer_address || null,
          due_date || null,
          subtotal,
          tva,
          total,
          notes || null,
          payment_terms || null,
        ],
      );
      const invoice = invResult.rows[0];

      for (const it of items) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount, tva_rate)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            invoice.id,
            it.product_id || null,
            it.description,
            it.quantity,
            it.unit_price,
            it.discount || 0,
            it.tva_rate !== undefined ? it.tva_rate : 20,
          ],
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
    const existing = await query(
      "SELECT * FROM invoices WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );
    if (existing.rowCount === 0)
      return res.status(404).json({ error: "Invoice not found" });
    if (existing.rows[0].status === "paid") {
      return res.status(400).json({ error: "Paid invoices cannot be edited" });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      due_date,
      notes,
      payment_terms,
      status,
      items,
    } = req.body;
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
        [
          req.params.id,
          req.user.id,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          due_date,
          notes,
          payment_terms,
          status,
        ],
      );
      const invoice = invResult.rows[0];

      if (Array.isArray(items)) {
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [
          invoice.id,
        ]);
        for (const it of items) {
          await client.query(
            `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, discount, tva_rate)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              invoice.id,
              it.product_id || null,
              it.description,
              it.quantity,
              it.unit_price,
              it.discount || 0,
              it.tva_rate !== undefined ? it.tva_rate : 20,
            ],
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
    const result = await query(
      "DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Invoice not found" });
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
        u.company AS seller_company,
        u.name AS seller_name,
        u.email AS seller_email,
        ss.store_name AS seller_store_name,
        ss.contact_email AS seller_contact_email,
        ss.contact_phone AS seller_contact_phone,
        ss.address AS seller_address,
        ss.city AS seller_city,
        ss.country AS seller_country,
        COALESCE((SELECT json_agg(json_build_object(
          'description', ii.description, 'quantity', ii.quantity,
          'unit_price', ii.unit_price, 'discount', ii.discount, 'tva_rate', ii.tva_rate,
          'total', ii.total) ORDER BY ii.id)
          FROM invoice_items ii WHERE ii.invoice_id = i.id), '[]') AS items
       FROM invoices i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN store_settings ss ON ss.user_id = i.user_id
       WHERE i.id = $1 AND i.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Invoice not found" });
    const inv = result.rows[0];

    const doc = new PDFDocument({ size: "A4", margin: 42 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${inv.invoice_number}.pdf"`,
    );
    doc.pipe(res);

    const left = 42;
    const right = doc.page.width - 42;
    const contentWidth = right - left;
    const muted = "#666666";
    const ink = "#181818";
    const sellerName =
      inv.seller_store_name || inv.seller_company || inv.seller_name;
    const sellerEmail = inv.seller_contact_email || inv.seller_email;
    const sellerAddress = [
      inv.seller_address,
      inv.seller_city,
      inv.seller_country,
    ]
      .filter(Boolean)
      .join(", ");
    const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR");
    const formatMoney = (amount) =>
      `${Number(amount || 0).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} MAD`;

    doc.fillColor(ink).font("Helvetica").fontSize(34).text("FACTURE", left, 38);
    doc.save();
    doc
      .strokeColor(muted)
      .lineWidth(0.8)
      .circle(right - 18, 62, 16)
      .stroke();
    doc.circle(right - 18, 62, 12).stroke();
    doc
      .moveTo(right - 24, 62)
      .lineTo(right - 12, 62)
      .stroke();
    doc
      .moveTo(right - 18, 56)
      .lineTo(right - 18, 68)
      .stroke();
    doc.restore();

    const drawPill = (text, x, y) => {
      const width = doc.widthOfString(text) + 18;
      doc.save();
      doc
        .lineWidth(0.7)
        .strokeColor(muted)
        .roundedRect(x, y, width, 19, 9)
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(ink)
        .text(text, x + 9, y + 5, {
          lineBreak: false,
        });
      doc.restore();
      return width;
    };
    const invoicePillWidth = drawPill(
      `Facture n° ${inv.invoice_number}`,
      left,
      91,
    );
    drawPill(formatDate(inv.date), left + invoicePillWidth + 8, 91);

    doc
      .moveTo(left, 128)
      .lineTo(right, 128)
      .lineWidth(0.7)
      .strokeColor(muted)
      .stroke();

    const columnTop = 146;
    const columnWidth = contentWidth * 0.46;
    const rightColumnX = right - columnWidth;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ink)
      .text(sellerName, left, columnTop, {
        width: columnWidth,
      });
    let sellerY = columnTop + 16;
    for (const detail of [
      inv.seller_contact_phone,
      sellerEmail,
      sellerAddress,
    ].filter(Boolean)) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(ink)
        .text(detail, left, sellerY, {
          width: columnWidth,
        });
      sellerY = doc.y + 2;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(ink)
      .text("À L'ATTENTION DE", rightColumnX, columnTop, {
        width: columnWidth,
        align: "right",
      });
    let customerY = columnTop + 16;
    const customerDetails = [
      inv.customer_name,
      inv.customer_phone,
      inv.customer_email,
      inv.customer_address,
    ].filter(Boolean);
    for (const detail of customerDetails) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(ink)
        .text(detail, rightColumnX, customerY, {
          width: columnWidth,
          align: "right",
        });
      customerY = doc.y + 2;
    }

    const columns = [
      { title: "DESCRIPTION", width: 236, align: "left" },
      { title: "PRIX", width: 86, align: "right" },
      { title: "QUANTITÉ", width: 86, align: "right" },
      { title: "TOTAL", width: contentWidth - 408, align: "right" },
    ];
    const tableX = left;
    let tableY = Math.max(sellerY, customerY) + 22;
    const rowBottomLimit = doc.page.height - 72;

    const drawTableHeader = () => {
      doc.save();
      doc.rect(tableX, tableY, contentWidth, 25).fill(ink);
      let x = tableX;
      for (const column of columns) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor("#FFFFFF")
          .text(column.title, x + 7, tableY + 8, {
            width: column.width - 14,
            align: column.align,
            lineBreak: false,
          });
        x += column.width;
      }
      doc.restore();
      tableY += 25;
    };
    drawTableHeader();

    for (const item of inv.items) {
      const description = item.description || "";
      const descriptionHeight = doc.heightOfString(description, {
        width: columns[0].width - 14,
        font: "Helvetica",
        fontSize: 8,
      });
      const rowHeight = Math.max(23, descriptionHeight + 10);

      if (tableY + rowHeight > rowBottomLimit) {
        doc.addPage();
        tableY = 42;
        drawTableHeader();
      }

      doc.save();
      doc
        .lineWidth(0.5)
        .strokeColor("#999999")
        .rect(tableX, tableY, contentWidth, rowHeight)
        .stroke();
      let x = tableX;
      for (const column of columns.slice(0, -1)) {
        x += column.width;
        doc
          .moveTo(x, tableY)
          .lineTo(x, tableY + rowHeight)
          .stroke();
      }
      const values = [
        description,
        formatMoney(item.unit_price),
        String(item.quantity),
        formatMoney(item.total),
      ];
      x = tableX;
      for (let index = 0; index < columns.length; index += 1) {
        const column = columns[index];
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(ink)
          .text(values[index], x + 7, tableY + 7, {
            width: column.width - 14,
            align: column.align,
          });
        x += column.width;
      }
      doc.restore();
      tableY += rowHeight;
    }

    const summaryHeight = 83;
    if (tableY + summaryHeight > rowBottomLimit) {
      doc.addPage();
      tableY = 42;
    }
    let summaryY = tableY + 13;
    const taxRates = [
      ...new Set(inv.items.map((item) => Number(item.tva_rate))),
    ];
    const taxLabel = taxRates.length === 1 ? `TVA (${taxRates[0]}%)` : "TVA";
    const summaryX = right - 220;
    const drawSummaryRow = (label, value, y, bold = false) => {
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? 10 : 9)
        .fillColor(ink);
      doc.text(label, summaryX, y, { width: 105, align: "right" });
      doc.text(value, summaryX + 112, y, { width: 108, align: "right" });
    };
    drawSummaryRow("Sous-total :", formatMoney(inv.subtotal), summaryY);
    summaryY += 19;
    drawSummaryRow(`${taxLabel} :`, formatMoney(inv.tva_amount), summaryY);
    summaryY += 21;
    doc.rect(left, summaryY - 2, contentWidth, 25).fill(ink);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("TOTAL :", summaryX, summaryY + 5, { width: 105, align: "right" });
    doc.text(formatMoney(inv.total), summaryX + 112, summaryY + 5, {
      width: 108,
      align: "right",
    });
    summaryY += 35;

    if (inv.notes) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(ink)
        .text("Notes", left, summaryY);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(inv.notes, left, summaryY + 12, {
          width: contentWidth,
        });
      summaryY = doc.y + 10;
    }

    if (summaryY + 74 > rowBottomLimit) {
      doc.addPage();
      summaryY = 42;
    }
    const footerTop = Math.max(summaryY + 18, doc.page.height - 103);
    const paymentTerms =
      inv.payment_terms ||
      (inv.due_date
        ? `Échéance : ${formatDate(inv.due_date)}`
        : "Selon accord convenu");
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(ink)
      .text(`Paiement à l'ordre de ${sellerName}`, left, footerTop, {
        width: columnWidth,
      });
    if (sellerEmail) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(muted)
        .text(sellerEmail, left, footerTop + 12, { width: columnWidth });
    }
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(ink)
      .text("Conditions de paiement", rightColumnX, footerTop, {
        width: columnWidth,
        align: "right",
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text(paymentTerms, rightColumnX, footerTop + 12, {
        width: columnWidth,
        align: "right",
      });

    doc
      .moveTo(left, doc.page.height - 62)
      .lineTo(right, doc.page.height - 62)
      .lineWidth(0.6)
      .strokeColor(muted)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(muted)
      .text("MERCI POUR VOTRE CONFIANCE", left, doc.page.height - 49, {
        width: contentWidth,
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ error: "Error generating PDF" });
  }
});

module.exports = router;
