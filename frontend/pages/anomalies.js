import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost, apiPut } from "../lib/api";
import toast from "react-hot-toast";
import {
 AlertTriangle,
 CheckCircle,
 Clock,
 XCircle,
 TrendingDown,
 Package,
 Star,
} from "lucide-react";

const SEVERITY_CONFIG = {
 critique: {
 label: "Critical",
 cls: "text-clay",
 dot: "bg-clay",
 border: "hairline bg-clay/5",
 },
 haute: {
 label: "High",
 cls: "text-ember-500",
 dot: "bg-ember-500",
 border: "hairline bg-ember-500/5",
 },
 moyenne: {
 label: "Medium",
 cls: "text-olive",
 dot: "bg-olive",
 border: "hairline bg-olive/5",
 },
};

const STATUS_CONFIG = {
 non_resolu: { label: "Unresolved", icon: XCircle, cls: "text-clay" },
 en_cours: { label: "In Progress", icon: Clock, cls: "text-ember-500" },
 resolu: { label: "Resolved", icon: CheckCircle, cls: "text-olive" },
};

const TYPE_ICONS = {
 baisse_ventes: TrendingDown,
 rupture_stock: Package,
 stock_faible: Package,
 avis_negatifs: Star,
};

const formatDetectedDate = (value) => {
 if (!value) return "—";

 const datePart = String(value).slice(0, 10);
 const date = new Date(`${datePart}T12:00:00`);

 if (Number.isNaN(date.getTime())) return String(value);

 return date.toLocaleDateString(undefined, {
 year: "numeric",
 month: "long",
 day: "numeric",
 });
};

export default function AnomaliesPage() {
 const [anomalies, setAnomalies] = useState([]);
 const [filter, setFilter] = useState("tous");
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const loadAnomalies = async () => {
 try {
 await apiPost("/analysis/detect-anomalies", {});
 const data = await apiGet("/analysis/anomalies");
 setAnomalies(data.anomalies || []);
 } catch (error) {
 toast.error(error.message || "Failed to load anomalies");
 } finally {
 setLoading(false);
 }
 };

 loadAnomalies();
 }, []);

 const markResolved = async (id) => {
 try {
 await apiPut(`/analysis/anomalies/${id}/resolve`);
 setAnomalies((current) =>
 current.map((a) => (a.id === id ? { ...a, status: "résolu" } : a)),
 );
 toast.success("Anomaly marked as resolved ✓");
 } catch (error) {
 toast.error(error.message || "Failed to update");
 }
 };
 const markInProgress = async (id) => {
 try {
 await apiPut(`/analysis/anomalies/${id}/in-progress`);
 setAnomalies((current) =>
 current.map((a) => (a.id === id ? { ...a, status: "en_cours" } : a)),
 );
 toast.success("Anomaly marked as in progress");
 } catch (error) {
 toast.error(error.message || "Failed to update");
 }
 };

 const filtered =
 filter === "tous"
 ? anomalies
 : anomalies.filter((a) =>
 filter === "non_résolu"
 ? a.status === "non_résolu"
 : filter === "en_cours"
 ? a.status === "en_cours"
 : filter === "résolu"
 ? a.status === "résolu"
 : a.severity === filter,
 );

 const critiques = anomalies.filter((a) => a.severity === "critique").length;
 const hautes = anomalies.filter((a) => a.severity === "haute").length;
 const nonResolus = anomalies.filter((a) => a.status === "non_résolu").length;
 const resolus = anomalies.filter((a) => a.status === "résolu").length;

 return (
 <Layout title="Anomaly Detection">
 {/* Stats */}
 <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
 {[
 {
 label: "Critical Anomalies",
 value: critiques,
 color: "bg-clay",
 icon: AlertTriangle,
 },
 {
 label: "High Priority",
 value: hautes,
 color: "bg-ember-500",
 icon: AlertTriangle,
 },
 {
 label: "Unresolved",
 value: nonResolus,
 color: "bg-ember-500",
 icon: XCircle,
 },
 {
 label: "Resolved",
 value: resolus,
 color: "bg-olive",
 icon: CheckCircle,
 },
 ].map((s, i) => (
 <div
 key={i}
 className="bg-surface border hairline rounded-xs p-4 flex items-center gap-4"
 >
 <div
 className={`w-11 h-11 rounded-xs ${s.color} flex items-center justify-center`}
 >
 <s.icon size={20} className="text-ground" />
 </div>
 <div>
 <p className="portal-label">{s.label}</p>
 <p className="portal-heading text-2xl">{s.value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Filters */}
 <div className="bg-surface border hairline rounded-xs p-4 mb-6">
 <div className="flex flex-wrap gap-2">
 {[
 { key: "tous", label: "All" },
 { key: "critique", label: " Critical" },
 { key: "haute", label: " High" },
 { key: "moyenne", label: " Medium" },
 { key: "non_résolu", label: "Unresolved" },
 { key: "en_cours", label: "In Progress" },
 { key: "résolu", label: "Resolved" },
 ].map((f) => (
 <button
 key={f.key}
 onClick={() => setFilter(f.key)}
 className={`portal-label px-3 py-1.5 rounded-xs font-medium transition-colors ${filter === f.key ? "bg-ember-500 text-ground" : "bg-canvas text-ink-2 hover:bg-canvas/50"}`}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>

 {loading && (
 <div className="bg-surface border hairline rounded-xs text-center py-12 portal-text">
 Loading anomalies…
 </div>
 )}

 {/* Anomalies List */}
 <div className="space-y-4">
 {filtered.length === 0 && (
 <div className="bg-surface border hairline rounded-xs text-center py-16">
 <CheckCircle
 size={48}
 className="mx-auto mb-3 text-olive opacity-60"
 />
 <p className="portal-label font-semibold text-ink">
 No anomalies in this category
 </p>
 <p className="portal-label text-ink-3 mt-1">
 Everything looks good!
 </p>
 </div>
 )}
 {filtered.map((a) => {
 const sev = SEVERITY_CONFIG[a.severity];
 const sta = STATUS_CONFIG[a.status];
 const TypeIcon = TYPE_ICONS[a.type] || AlertTriangle;
 return (
 <div
 key={a.id}
 className={`bg-surface border ${sev.border} rounded-xs p-4 transition-colors hover: animate-rise-in`}
 >
 <div className="flex flex-col sm:flex-row sm:items-start gap-4">
 <div
 className={`w-12 h-12 rounded-xs ${a.severity === "critique" ? "bg-clay/20" : a.severity === "haute" ? "bg-ember-500/20" : "bg-olive/20"} flex items-center justify-center flex-shrink-0`}
 >
 <TypeIcon
 size={22}
 className={
 a.severity === "critique"
 ? "text-clay"
 : a.severity === "haute"
 ? "text-ember-500"
 : "text-olive"
 }
 />
 </div>
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <h3 className="portal-label font-bold text-ink">
 {a.product_name || a.product || "Anomaly"}
 </h3>
 <span className={sev.cls}>{sev.label}</span>
 <div className={`flex items-center gap-1 ${sta.cls}`}>
 <sta.icon size={12} />
 <span className="portal-label font-medium">
 {sta.label}
 </span>
 </div>
 </div>
 <p className="portal-text mb-1">{a.description}</p>
 <p className="portal-label text-ink-3">
 Detected {formatDetectedDate(a.detected_at || a.detected)}
 </p>
 </div>
 <div className="flex sm:flex-col gap-2 flex-shrink-0">
 {a.status !== "résolu" && (
 <>
 {a.status === "non_résolu" && (
 <button
 onClick={() => markInProgress(a.id)}
 className="portal-label px-3 py-1.5 rounded-xs bg-ember-500/20 text-ember-500 hover:bg-ember-500/30 transition-colors font-medium flex items-center gap-1"
 >
 <Clock size={12} /> In Progress
 </button>
 )}
 <button
 onClick={() => markResolved(a.id)}
 className="portal-label px-3 py-1.5 rounded-xs bg-olive/20 text-olive hover:bg-olive/30 transition-colors font-medium flex items-center gap-1"
 >
 <CheckCircle size={12} /> Resolve
 </button>
 </>
 )}
 {a.status === "résolu" && (
 <span className="portal-label px-3 py-1.5 rounded-xs bg-olive/10 text-olive font-medium flex items-center gap-1">
 <CheckCircle size={12} /> Resolved
 </span>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </Layout>
 );
}
