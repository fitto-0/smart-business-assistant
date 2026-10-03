import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { Plus, Trash2, Edit2 } from "lucide-react";

const inputClass = "w-full bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber";
const selectClass = "bg-ground border hairline rounded-md px-2 py-1.5 text-sm outline-none focus:border-amber";

const emptyForm = { category: "autre", amount: "", date: "", description: "", supplier: "", payment_method: "virement" };

export default function ExpensesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ byCategory: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const notify = (text, error = false) => { setMessage(text); setIsError(error); };

  const load = useCallback(async () => {
    try {
      const [expData, sumData] = await Promise.all([
        apiGet("/expenses"),
        apiGet("/expenses/summary"),
      ]);
      setExpenses(expData.expenses || []);
      setSummary(sumData);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (exp) => {
    setEditingId(exp.id);
    setForm({
      category: exp.category || "autre",
      amount: exp.amount || "",
      date: exp.date ? exp.date.split("T")[0] : "",
      description: exp.description || "",
      supplier: exp.supplier || "",
      payment_method: exp.payment_method || "virement",
    });
    setShowForm(true);
    notify("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); notify("");
    try {
      const body = { ...form, amount: parseFloat(form.amount) };
      if (editingId) {
        await apiPut(`/expenses/${editingId}`, body);
        notify(t("expenses.expenseUpdated"));
      } else {
        await apiPost("/expenses", body);
        notify(t("expenses.expenseAdded"));
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (err) { notify(err.message, true); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm(t("expenses.confirmDelete"))) return;
    notify("");
    try { await apiDelete(`/expenses/${id}`); notify(t("expenses.expenseDeleted")); load(); }
    catch (err) { notify(err.message, true); }
  };

  if (loading) {
    return (
      <Layout title={t("expenses.title")}>
        <div className="panel px-4 py-16 text-center">
          <p className="micro-2 animate-shimmer">{t("common.loading")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t("expenses.title")}>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="portal-label text-amber">MANAGEMENT</p>
            <h1 className="portal-heading text-3xl mt-1">{t("expenses.title")}</h1>
            <p className="portal-text mt-2">{t("expenses.subtitle")}</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); notify(""); }}
            className="px-4 py-2 rounded-lg bg-amber text-ground font-semibold text-sm"
          >
            <Plus size={15} className="inline mr-1.5" />
            {t("expenses.newExpense")}
          </button>
        </div>

        {message && <p className={`text-sm ${isError ? "text-clay" : "text-amber"}`}>{message}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-ground-secondary border hairline rounded-xl p-4">
            <p className="portal-label text-ink-3">{t("expenses.totalSpent")}</p>
            <p className="portal-heading text-2xl mt-1">{Number(summary.total || 0).toFixed(2)} MAD</p>
          </div>
          {summary.byCategory.slice(0, 3).map((cat) => (
            <div key={cat.category} className="bg-ground-secondary border hairline rounded-xl p-4">
              <p className="portal-label text-ink-3">
                {t(`expenses.categories.${cat.category}`)}
              </p>
              <p className="portal-heading text-2xl mt-1">{Number(cat.total).toFixed(2)} MAD</p>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 modal-scrim flex items-center justify-center z-50 p-4">
            <form onSubmit={submit} className="modal-card bg-surface border hairline rounded-xs p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="portal-heading text-lg mb-4">{editingId ? t("expenses.editExpense") : t("expenses.newExpense")}</h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="portal-label">{t("expenses.category")} *</span>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`mt-2 ${selectClass}`}>
                    {Object.entries(t("expenses.categories")).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="portal-label">Amount (MAD) *</span>
                  <input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={`mt-2 ${inputClass}`} />
                </label>
                <label className="block">
                  <span className="portal-label">{t("expenses.date")}</span>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`mt-2 ${inputClass}`} />
                </label>
                <label className="block">
                  <span className="portal-label">{t("expenses.description")} *</span>
                  <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`mt-2 ${inputClass}`} />
                </label>
                <label className="block">
                  <span className="portal-label">{t("expenses.supplier")}</span>
                  <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={`mt-2 ${inputClass}`} />
                </label>
                <label className="block">
                  <span className="portal-label">Payment Method</span>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={`mt-2 ${selectClass}`}>
                    {Object.entries(t("expenses.paymentMethods")).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-lg border hairline text-sm">{t("common.cancel")}</button>
                <button disabled={saving} className="px-4 py-2 rounded-lg bg-amber text-ground font-semibold text-sm disabled:opacity-50">
                  {saving ? t("common.loading") : editingId ? t("expenses.editExpense") : t("expenses.newExpense")}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto bg-ground-secondary border hairline rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b hairline">
              <tr>
                <th className="p-4">{t("expenses.date")}</th>
                <th className="p-4">{t("expenses.category")}</th>
                <th className="p-4">{t("expenses.description")}</th>
                <th className="p-4">{t("expenses.supplier")}</th>
                <th className="p-4">{t("expenses.amount")}</th>
                <th className="p-4">{t("expenses.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b hairline last:border-0">
                  <td className="p-4 text-ink-2">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="portal-label">
                      {t(`expenses.categories.${exp.category}`)}
                    </span>
                  </td>
                  <td className="p-4">{exp.description}</td>
                  <td className="p-4 text-ink-2">{exp.supplier || "—"}</td>
                  <td className="p-4 font-medium">{Number(exp.amount).toFixed(2)} MAD</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(exp)} className="text-ink-2 hover:text-ink" title={t("common.edit")}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => remove(exp.id)} className="text-clay hover:opacity-80" title={t("common.delete")}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-3">
                    {t("expenses.noExpenses")}
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
