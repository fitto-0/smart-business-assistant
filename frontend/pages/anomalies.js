import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Status, Empty } from "../components/PageHeader";
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
  Wand2,
  ListChecks,
  ExternalLink,
  Loader2,
} from "lucide-react";

const SEVERITY_CONFIG = {
  critique: { label: "Critical", tone: "clay", border: "bg-clay/5" },
  haute: { label: "High", tone: "ember", border: "bg-ember-500/5" },
  moyenne: { label: "Medium", tone: "olive", border: "bg-olive/5" },
};

const STATUS_CONFIG = {
  non_resolu: { label: "Awaiting action", tone: "clay" },
  en_cours: { label: "In progress", tone: "ember" },
  resolu: { label: "Resolved", tone: "olive" },
};

// Safe fallbacks in case the API ever returns an unexpected key
const DEFAULT_SEVERITY = SEVERITY_CONFIG.moyenne;
const DEFAULT_STATUS = STATUS_CONFIG.non_resolu;

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
  const [guideAnomaly, setGuideAnomaly] = useState(null);
  const [guidePlan, setGuidePlan] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);

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

  const openGuide = async (anomaly) => {
    setGuideAnomaly(anomaly);
    setGuidePlan(null);
    setGuideLoading(true);
    try {
      const data = await apiGet(`/analysis/anomalies/${anomaly.id}/plan`);
      setGuideAnomaly(data.anomaly || anomaly);
      setGuidePlan(data.plan || null);
      setAnomalies((current) =>
        current.map((a) =>
          a.id === anomaly.id
            ? {
                ...a,
                resolution_steps: data.anomaly?.resolution_steps || a.resolution_steps || [],
                current_step: data.anomaly?.current_step ?? a.current_step,
                status: data.anomaly?.status || a.status,
              }
            : a,
        ),
      );
    } catch (error) {
      toast.error(error.message || "Failed to load the resolution guide");
      setGuideAnomaly(null);
    } finally {
      setGuideLoading(false);
    }
  };

  const closeGuide = () => {
    setGuideAnomaly(null);
    setGuidePlan(null);
    setGuideLoading(false);
  };

  const toggleGuideStep = async (stepIndex, done) => {
    if (!guideAnomaly) return;
    try {
      const updated = await apiPut(`/analysis/anomalies/${guideAnomaly.id}/step`, {
        step: stepIndex,
        done,
      });
      const nextPlan = updated.plan || null;
      setGuidePlan(nextPlan);
      setAnomalies((current) =>
        current.map((a) =>
          a.id === guideAnomaly.id
            ? {
                ...a,
                resolution_steps: updated.resolution_steps || [],
                current_step: updated.current_step,
                status: a.status === "non_resolu" ? "en_cours" : a.status,
              }
            : a,
        ),
      );
      setGuideAnomaly((current) =>
        current
          ? {
              ...current,
              resolution_steps: updated.resolution_steps || [],
              current_step: updated.current_step,
              status: current.status === "non_resolu" ? "en_cours" : current.status,
            }
          : current,
      );
    } catch (error) {
      toast.error(error.message || "Failed to update step");
    }
  };

  const markResolved = async (id) => {
    const target = anomalies.find((a) => a.id === id);
    try {
      await apiPut(`/analysis/anomalies/${id}/resolve`);
      setAnomalies((current) =>
        current.map((a) => (a.id === id ? { ...a, status: "resolu" } : a)),
      );
      if (guideAnomaly?.id === id) closeGuide();
      toast.success("Anomaly marked as resolved");
    } catch (error) {
      // Backend blocks resolving before the guide is complete: open the guide.
      if (error.message && /guide|steps/i.test(error.message) && target) {
        toast.error(error.message);
        openGuide(target);
        return;
      }
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
      : anomalies.filter((a) => {
          if (filter === "non_resolu") return a.status === "non_resolu";
          if (filter === "en_cours") return a.status === "en_cours";
          if (filter === "resolu") return a.status === "resolu";
          // otherwise it's a severity filter
          return a.severity === filter;
        });

  const critiques = anomalies.filter((a) => a.severity === "critique").length;
  const hautes = anomalies.filter((a) => a.severity === "haute").length;
  const nonResolus = anomalies.filter((a) => a.status === "non_resolu").length;
  const resolus = anomalies.filter((a) => a.status === "resolu").length;

  return (
    <Layout title="Anomaly Detection">
      {/* Intro — plain-language explainer */}
      <div className="bg-surface border hairline rounded-xs p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xs bg-surface-2 border border-line flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} strokeWidth={1.5} className="text-ember-500" />
          </div>
          <div>
            <h3 className="portal-heading text-base mb-1">What we&apos;re watching for</h3>
            <p className="portal-text leading-relaxed">
              We keep an eye on your sales, stock, and reviews. When something
              looks unusual, like revenue suddenly dropping, a product about
              to run out, or a wave of bad reviews, it shows up here with a
              suggested fix.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Critical anomalies",
            value: critiques,
            color: "text-clay",
            icon: AlertTriangle,
          },
          {
            label: "High severity",
            value: hautes,
            color: "text-ember-500",
            icon: AlertTriangle,
          },
          {
            label: "Awaiting action",
            value: nonResolus,
            color: "text-ember-500",
            icon: XCircle,
          },
          {
            label: "Resolved",
            value: resolus,
            color: "text-olive",
            icon: CheckCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-surface border hairline rounded-xs p-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="micro">{s.label}</p>
              <p className="stat-value mt-1">{s.value}</p>
            </div>
            <s.icon
              size={18}
              strokeWidth={1.5}
              className={`shrink-0 ${s.color}`}
            />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface border hairline rounded-xs p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "tous", label: "All" },
            { key: "critique", label: "Critical" },
            { key: "haute", label: "High" },
            { key: "moyenne", label: "Medium" },
            { key: "non_resolu", label: "Awaiting action" },
            { key: "en_cours", label: "In progress" },
            { key: "resolu", label: "Resolved" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`font-mono text-[12.5px] font-medium uppercase tracking-label antialiased px-3 py-1.5 rounded-xs transition-colors ${
                filter === f.key
                  ? "bg-surface-2 text-ink"
                  : "bg-canvas text-ink-2 hover:text-ink"
              }`}
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
        {filtered.length === 0 && !loading && (
          <div className="bg-surface border hairline rounded-xs">
            <Empty
              title="No anomalies in this view"
              hint="Nothing needs your attention here."
            />
          </div>
        )}
        {filtered.map((a) => {
          const sev = SEVERITY_CONFIG[a.severity] || DEFAULT_SEVERITY;
          const sta = STATUS_CONFIG[a.status] || DEFAULT_STATUS;
          const TypeIcon = TYPE_ICONS[a.type] || AlertTriangle;
          return (
            <div
              key={a.id}
              className={`bg-surface border hairline rounded-xs p-4 animate-rise-in ${sev.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xs ${
                    a.severity === "critique"
                      ? "bg-clay/10"
                      : a.severity === "haute"
                        ? "bg-ember-500/10"
                        : "bg-olive/10"
                  } flex items-center justify-center flex-shrink-0`}
                >
                  <TypeIcon
                    size={20}
                    strokeWidth={1.5}
                    className={
                      a.severity === "critique"
                        ? "text-clay"
                        : a.severity === "haute"
                          ? "text-ember-500"
                          : "text-olive"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h3 className="text-[13px] font-medium text-ink">
                      {a.product_name || a.product || "Anomaly"}
                    </h3>
                    <Status tone={sev.tone}>{sev.label}</Status>
                    <Status tone={sta.tone}>{sta.label}</Status>
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink-2 mb-1.5">
                    {a.description}
                  </p>
                  <p className="micro">
                    Detected · {formatDetectedDate(a.detected_at || a.detected)}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {a.status !== "resolu" && (
                    <>
                      <button
                        onClick={() => openGuide(a)}
                        className="font-mono text-[12.5px] font-medium uppercase tracking-label antialiased px-3 py-1.5 rounded-xs border border-ember-500/40 text-ember-500 hover:bg-ember-500/10 transition-colors flex items-center gap-1.5"
                      >
                        <Wand2 size={12} /> Resolve with guide
                      </button>
                      {a.status === "non_resolu" && (
                        <button
                          onClick={() => markInProgress(a.id)}
                          className="font-mono text-[12.5px] font-medium uppercase tracking-label antialiased px-3 py-1.5 rounded-xs border border-line text-ink-2 hover:text-ember-500 hover:border-ember-500/50 transition-colors flex items-center gap-1.5"
                        >
                          <Clock size={12} /> In progress
                        </button>
                      )}
                      <button
                        onClick={() => markResolved(a.id)}
                        className="font-mono text-[12.5px] font-medium uppercase tracking-label antialiased px-3 py-1.5 rounded-xs border border-line text-ink-2 hover:text-olive hover:border-olive/50 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle size={12} /> Quick resolve
                      </button>
                    </>
                  )}
                  {a.status === "resolu" && (
                    <Status tone="olive" className="px-3 py-1.5">
                      Resolved
                    </Status>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {guideAnomaly && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={closeGuide}
          />
          <div className="relative bg-surface border hairline rounded-xs w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 animate-rise-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="micro mb-1">Resolution guide</p>
                <h3 className="portal-heading text-lg">
                  {guideLoading ? "Loading the solution…" : guidePlan?.title || "Resolve this anomaly"}
                </h3>
                <p className="portal-text mt-1.5 leading-relaxed">
                  {guideLoading ? "Fetching the step-by-step solution." : guidePlan?.summary}
                </p>
              </div>
              <button
                onClick={closeGuide}
                className="w-8 h-8 rounded-xs border border-line text-ink-2 hover:text-ink flex items-center justify-center flex-shrink-0"
                aria-label="Close guide"
              >
                <XCircle size={15} />
              </button>
            </div>

            {guideLoading && (
              <div className="flex items-center justify-center gap-2 py-10 portal-text">
                <Loader2 size={16} className="animate-spin" /> Building your steps…
              </div>
            )}

            {!guideLoading && guidePlan && (
              <>
                <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xs bg-canvas/60 border hairline">
                  <ListChecks size={15} className="text-ember-500 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-line/60 overflow-hidden">
                    <div
                      className="h-full bg-olive rounded-full transition-all"
                      style={{
                        width: `${guidePlan.total_steps ? Math.round((guidePlan.completed_steps / guidePlan.total_steps) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="micro whitespace-nowrap">
                    {guidePlan.completed_steps}/{guidePlan.total_steps} steps
                  </span>
                </div>

                <ol className="space-y-3">
                  {guidePlan.steps.map((step) => (
                    <li
                      key={step.index}
                      className={`border hairline rounded-xs p-3.5 ${step.done ? "bg-olive/5 border-olive/30" : "bg-canvas/40"}`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(step.done)}
                          onChange={(e) => toggleGuideStep(step.index, e.target.checked)}
                          className="mt-1 w-4 h-4 accent-[#7E9C6B]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[14px] font-medium ${step.done ? "line-through text-ink-3" : "text-ink"}`}>
                            Step {step.index + 1} · {step.title}
                          </p>
                          <p className="text-[13px] text-ink-2 leading-relaxed mt-1">{step.detail}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="micro">Do: {step.action}</span>
                            {step.link && (
                              <a
                                href={step.link}
                                onClick={(e) => e.stopPropagation()}
                                className="font-mono text-[12px] uppercase tracking-label text-ember-500 hover:underline inline-flex items-center gap-1"
                              >
                                {step.linkLabel || "Open"} <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                          <p className="micro mt-1.5 opacity-80">Done when: {step.verify}</p>
                        </div>
                        {step.done && <CheckCircle size={16} className="text-olive flex-shrink-0 mt-0.5" />}
                      </label>
                    </li>
                  ))}
                </ol>

                <div className="flex flex-col sm:flex-row gap-2 mt-5">
                  {guidePlan.link && (
                    <a
                      href={guidePlan.link}
                      className="btn-ghost flex items-center justify-center gap-1.5 flex-1"
                    >
                      {guidePlan.linkLabel || "Go to solution"} <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => markResolved(guideAnomaly.id)}
                    disabled={guidePlan.completed_steps < guidePlan.total_steps}
                    title={
                      guidePlan.completed_steps < guidePlan.total_steps
                        ? `Complete all steps first (${guidePlan.completed_steps}/${guidePlan.total_steps})`
                        : "All steps done — resolve now"
                    }
                    className={`flex items-center justify-center gap-1.5 flex-1 font-mono text-[12.5px] font-medium uppercase tracking-label px-3 py-2.5 rounded-xs border transition-colors ${
                      guidePlan.completed_steps < guidePlan.total_steps
                        ? "border-line text-ink-3 cursor-not-allowed"
                        : "border-olive/50 text-olive hover:bg-olive/10"
                    }`}
                  >
                    <CheckCircle size={13} />
                    {guidePlan.completed_steps < guidePlan.total_steps
                      ? `Resolve (${guidePlan.completed_steps}/${guidePlan.total_steps})`
                      : "Mark resolved"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
