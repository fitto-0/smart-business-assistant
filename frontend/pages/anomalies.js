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
    cls: "text-red-400",
    dot: "bg-red-400",
    border: "hairline bg-red-400/5",
  },
  haute: {
    label: "High",
    cls: "text-amber",
    dot: "bg-amber",
    border: "hairline bg-amber/5",
  },
  moyenne: {
    label: "Medium",
    cls: "text-teal",
    dot: "bg-teal",
    border: "hairline bg-teal/5",
  },
};

const STATUS_CONFIG = {
  non_résolu: { label: "Unresolved", icon: XCircle, cls: "text-red-400" },
  en_cours: { label: "In Progress", icon: Clock, cls: "text-amber" },
  résolu: { label: "Resolved", icon: CheckCircle, cls: "text-teal" },
};

const TYPE_ICONS = {
  baisse_ventes: TrendingDown,
  rupture_stock: Package,
  stock_faible: Package,
  avis_négatifs: Star,
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
            color: "bg-red-400",
            icon: AlertTriangle,
          },
          {
            label: "High Priority",
            value: hautes,
            color: "bg-amber",
            icon: AlertTriangle,
          },
          {
            label: "Unresolved",
            value: nonResolus,
            color: "bg-amber",
            icon: XCircle,
          },
          {
            label: "Resolved",
            value: resolus,
            color: "bg-teal",
            icon: CheckCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center`}
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
      <div className="bg-ground-secondary border hairline rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "tous", label: "All" },
            { key: "critique", label: "🔴 Critical" },
            { key: "haute", label: "🟡 High" },
            { key: "moyenne", label: "🔵 Medium" },
            { key: "non_résolu", label: "Unresolved" },
            { key: "en_cours", label: "In Progress" },
            { key: "résolu", label: "Resolved" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`portal-label px-3 py-1.5 rounded-lg font-medium transition-all ${filter === f.key ? "bg-amber text-ground" : "bg-ground text-ink-secondary hover:bg-ground/50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-ground-secondary border hairline rounded-xl text-center py-12 portal-text">
          Loading anomalies…
        </div>
      )}

      {/* Anomalies List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-ground-secondary border hairline rounded-xl text-center py-16">
            <CheckCircle
              size={48}
              className="mx-auto mb-3 text-teal opacity-60"
            />
            <p className="portal-label font-semibold text-ink">
              No anomalies in this category
            </p>
            <p className="portal-label text-muted mt-1">
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
              className={`bg-ground-secondary border ${sev.border} rounded-xl p-4 transition-all hover:shadow-lg animate-slide-up`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${a.severity === "critique" ? "bg-red-400/20" : a.severity === "haute" ? "bg-amber/20" : "bg-teal/20"} flex items-center justify-center flex-shrink-0`}
                >
                  <TypeIcon
                    size={22}
                    className={
                      a.severity === "critique"
                        ? "text-red-400"
                        : a.severity === "haute"
                          ? "text-amber"
                          : "text-teal"
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
                  <p className="portal-label text-muted">
                    Detected {formatDetectedDate(a.detected_at || a.detected)}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {a.status !== "résolu" && (
                    <>
                      {a.status === "non_résolu" && (
                        <button
                          onClick={() => markInProgress(a.id)}
                          className="portal-label px-3 py-1.5 rounded-lg bg-amber/20 text-amber hover:bg-amber/30 transition-all font-medium flex items-center gap-1"
                        >
                          <Clock size={12} /> In Progress
                        </button>
                      )}
                      <button
                        onClick={() => markResolved(a.id)}
                        className="portal-label px-3 py-1.5 rounded-lg bg-teal/20 text-teal hover:bg-teal/30 transition-all font-medium flex items-center gap-1"
                      >
                        <CheckCircle size={12} /> Resolve
                      </button>
                    </>
                  )}
                  {a.status === "résolu" && (
                    <span className="portal-label px-3 py-1.5 rounded-lg bg-teal/10 text-teal font-medium flex items-center gap-1">
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
