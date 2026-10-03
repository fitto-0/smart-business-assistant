import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  getApiBaseUrl,
  getCurrentOrgId,
} from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { Plus, Trash2, Download, Edit2 } from "lucide-react";

const inputClass =
  "w-full bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber";
const selectClass =
  "bg-ground border hairline rounded-md px-2 py-1.5 text-sm outline-none focus:border-amber";

const emptyItem = {
  description: "",
  quantity: 1,
  unit_price: 0,
  discount: 0,
  tva_rate: 20,
};

const STATUS_COLORS = {
  draft: "text-ink-3",
  sent: "text-amber",
  paid: "text-ember-500",
  overdue: "text-clay",
  cancelled: "text-clay",
};

export default function InvoicesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    due_date: "",
    notes: "",
    payment_terms: "",
    items: [{ ...emptyItem }],
  });

  const notify = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/invoices");
      setInvoices(data.invoices || []);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it,
      ),
    }));

  const openEdit = async (inv) => {
    try {
      const data = await apiGet(`/invoices/${inv.id}`);
      const inv2 = data.invoice;
      setEditingId(inv.id);
      setForm({
        customer_name: inv2.customer_name || "",
        customer_email: inv2.customer_email || "",
        customer_phone: inv2.customer_phone || "",
        customer_address: inv2.customer_address || "",
        due_date: inv2.due_date ? inv2.due_date.split("T")[0] : "",
        notes: inv2.notes || "",
        payment_terms: inv2.payment_terms || "",
        items: (inv2.items || []).map((it) => ({
          description: it.description || "",
          quantity: it.quantity || 1,
          unit_price: it.unit_price || 0,
          discount: it.discount || 0,
          tva_rate: it.tva_rate || 20,
        })),
      });
      setShowForm(true);
      notify("");
    } catch (err) {
      notify(err.message, true);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    notify("");
    try {
      const body = {
        ...form,
        items: form.items.filter((it) => it.description.trim()),
      };
      if (editingId) {
        await apiPut(`/invoices/${editingId}`, body);
        notify(t("invoices.invoiceUpdated"));
      } else {
        await apiPost("/invoices", body);
        notify(t("invoices.invoiceCreated"));
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        due_date: "",
        notes: "",
        payment_terms: "",
        items: [{ ...emptyItem }],
      });
      load();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("invoices.confirmDelete"))) return;
    notify("");
    try {
      await apiDelete(`/invoices/${id}`);
      notify(t("invoices.invoiceDeleted"));
      load();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const downloadPdf = async (id) => {
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("sba_token="))
      ?.split("=")[1];
    const organizationId = getCurrentOrgId();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (organizationId) headers["X-Organization-Id"] = String(organizationId);

    setDownloadingId(id);
    try {
      const response = await fetch(`${getApiBaseUrl()}/invoices/${id}/pdf`, {
        headers,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ||
            t("invoices.downloadPdfError") ||
            "Failed to download invoice PDF",
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/pdf")) {
        throw new Error(
          t("invoices.invalidPdf") || "The server did not return a PDF",
        );
      }

      const blob = await response.blob();
      if ((await blob.slice(0, 5).text()) !== "%PDF-") {
        throw new Error(
          t("invoices.invalidPdf") || "The downloaded file is not a valid PDF",
        );
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify(
        err.message ||
          t("invoices.downloadPdfError") ||
          "Failed to download invoice PDF",
        true,
      );
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Layout title={t("invoices.title")}>
        <div className="panel px-4 py-16 text-center">
          <p className="micro-2 animate-shimmer">{t("common.loading")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t("invoices.title")}>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="portal-label text-amber">INVOICING</p>
            <h1 className="portal-heading text-3xl mt-1">
              {t("invoices.title")}
            </h1>
            <p className="portal-text mt-2">{t("invoices.subtitle")}</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm({
                customer_name: "",
                customer_email: "",
                customer_phone: "",
                customer_address: "",
                due_date: "",
                notes: "",
                payment_terms: "",
                items: [{ ...emptyItem }],
              });
              notify("");
            }}
            className="px-4 py-2 rounded-lg bg-amber text-ground font-semibold text-sm"
          >
            <Plus size={15} className="inline mr-1.5" />
            {t("invoices.newInvoice")}
          </button>
        </div>

        {message && (
          <p className={`text-sm ${isError ? "text-clay" : "text-amber"}`}>
            {message}
          </p>
        )}

        {showForm && (
          <div className="fixed inset-0 modal-scrim flex items-center justify-center z-50 p-4">
            <form
              onSubmit={submit}
              className="modal-card bg-surface border hairline rounded-xs p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="portal-heading text-lg mb-4">
                {editingId
                  ? t("invoices.editInvoice")
                  : t("invoices.newInvoice")}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="portal-label">
                    {t("invoices.customer")} *
                  </span>
                  <input
                    required
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm({ ...form, customer_name: e.target.value })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="portal-label">Email</span>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) =>
                      setForm({ ...form, customer_email: e.target.value })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="portal-label">Phone</span>
                  <input
                    value={form.customer_phone}
                    onChange={(e) =>
                      setForm({ ...form, customer_phone: e.target.value })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="portal-label">Address</span>
                  <input
                    value={form.customer_address}
                    onChange={(e) =>
                      setForm({ ...form, customer_address: e.target.value })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="portal-label">{t("invoices.dueDate")}</span>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm({ ...form, due_date: e.target.value })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className="portal-label">
                    {t("invoices.paymentTerms")}
                  </span>
                  <input
                    value={form.payment_terms}
                    onChange={(e) =>
                      setForm({ ...form, payment_terms: e.target.value })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="portal-label">
                    {t("invoices.lineItems")}
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-amber font-semibold"
                  >
                    + {t("invoices.addLine")}
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          placeholder={`${t("invoices.description")} *`}
                          value={item.description}
                          onChange={(e) =>
                            updateItem(idx, "description", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="number"
                          min="1"
                          placeholder={t("invoices.quantity")}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={t("invoices.unitPrice")}
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "unit_price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={t("invoices.discount")}
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "discount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <select
                          value={item.tva_rate}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "tva_rate",
                              parseFloat(e.target.value),
                            )
                          }
                          className={selectClass}
                        >
                          <option value={0}>TVA 0%</option>
                          <option value={7}>TVA 7%</option>
                          <option value={10}>TVA 10%</option>
                          <option value={14}>TVA 14%</option>
                          <option value={20}>TVA 20%</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-clay hover:opacity-80"
                          title={t("invoices.delete")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block mt-4">
                <span className="portal-label">{t("invoices.notes")}</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`mt-2 ${inputClass}`}
                  rows={2}
                />
              </label>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 rounded-lg border hairline text-sm"
                >
                  {t("common.cancel")}
                </button>
                <button
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-amber text-ground font-semibold text-sm disabled:opacity-50"
                >
                  {saving
                    ? t("common.loading")
                    : editingId
                      ? t("invoices.editInvoice")
                      : t("invoices.newInvoice")}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto bg-ground-secondary border hairline rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b hairline">
              <tr>
                <th className="p-4">{t("invoices.invoiceNumber")}</th>
                <th className="p-4">{t("invoices.customer")}</th>
                <th className="p-4">{t("invoices.date")}</th>
                <th className="p-4">{t("invoices.total")}</th>
                <th className="p-4">{t("invoices.status")}</th>
                <th className="p-4">{t("invoices.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hairline last:border-0">
                  <td className="p-4 font-mono text-[13px]">
                    {inv.invoice_number}
                  </td>
                  <td className="p-4">
                    <strong className="block">{inv.customer_name}</strong>
                    {inv.customer_email && (
                      <span className="portal-label">{inv.customer_email}</span>
                    )}
                  </td>
                  <td className="p-4 text-ink-2">
                    {new Date(inv.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium">
                    {Number(inv.total).toFixed(2)} MAD
                  </td>
                  <td className="p-4">
                    <span
                      className={`portal-label ${STATUS_COLORS[inv.status] || "text-ink-3"}`}
                    >
                      {t(`invoices.statusLabels.${inv.status}`)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => downloadPdf(inv.id)}
                        disabled={downloadingId === inv.id}
                        className="text-ink-2 hover:text-ink disabled:opacity-50"
                        title={t("invoices.downloadPdf")}
                        aria-label={t("invoices.downloadPdf")}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(inv)}
                        className="text-ink-2 hover:text-ink"
                        title={t("invoices.edit")}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => remove(inv.id)}
                        className="text-clay hover:opacity-80"
                        title={t("invoices.delete")}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-3">
                    {t("invoices.noInvoices")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
