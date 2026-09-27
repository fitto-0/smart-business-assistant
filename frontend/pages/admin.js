import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import PageHeader, {
  Ledger,
  Section,
  Status,
  NoirTable,
} from "../components/PageHeader";
import { apiGet } from "../lib/api";
import { fmt, fmtMAD } from "../lib/format";
import {
  CHART,
  SERIES,
  axisProps,
  tooltipCursor,
  EmberAreaFill,
  emberUrl,
} from "../lib/chartTheme";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  ShieldCheck,
  Activity,
  Coins,
  Package,
  Star,
  AlertTriangle,
  Settings,
  UserCog,
  ArrowRight,
  Store,
} from "lucide-react";

/* Hairline tooltip — mono, square LED swatch, unit only where it belongs. */
const ChartTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface border border-line rounded-xs px-3 py-2">
      <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink-2 antialiased mb-1">
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          className="font-mono text-[12.5px] font-medium tabular-nums text-ink antialiased"
        >
          <span
            aria-hidden="true"
            className="inline-block w-[5px] h-[5px] me-1.5 align-middle"
            style={{ background: p.color || p.payload?.fill || CHART.ember }}
          />
          {p.name}: {fmt(p.value)}
          {unit && String(p.dataKey) === "revenue" ? ` ${unit}` : ""}
        </p>
      ))}
    </div>
  );
};

function Metric({ icon: Icon, label, value, tone = "bg-ember-500" }) {
  return (
    <div className="bg-ground-secondary border hairline rounded-xl p-5 flex items-center gap-4">
      <div
        className={`${tone} w-11 h-11 rounded-xl flex items-center justify-center`}
      >
        <Icon size={21} className="text-ground" />
      </div>
      <div className="min-w-0">
        <p className="portal-label">{label}</p>
        <p className="portal-heading text-2xl mt-1 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

const dateTime = (value) =>
  value ? new Date(value).toLocaleString() : "—";

const dateOnly = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

/* Whole-number deltas keep large swings readable (12300.0% → 12300%). */
const roundPct = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
};

const pctLabel = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n >= 0 ? "+" : ""}${Math.round(n)}%`;
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/admin/analytics")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error)
    return (
      <Layout title="App analytics">
        <div className="p-6 text-clay">{error}</div>
      </Layout>
    );
  if (!data)
    return (
      <Layout title="App analytics">
        <div className="p-6 portal-text">Loading...</div>
      </Layout>
    );

  const o = data.overview || {};
  const g = o.growth || {};
  const health = data.health || {};
  const activity = data.activity || { signups: [], logins: [] };
  const trend = data.trend || [];

  const ledger = [
    {
      label: "Revenue, last 30 days",
      value: `${fmt(o.revenue_30d)} MAD`,
      delta: roundPct(g.revenue),
      deltaLabel: pctLabel(g.revenue),
    },
    {
      label: "Orders, last 30 days",
      value: fmt(o.orders_30d),
      delta: roundPct(g.orders),
      deltaLabel: pctLabel(g.orders),
    },
    { label: "Average order value, 30 days", value: fmtMAD(o.aov) },
    { label: "Active tenants, 90 days", value: fmt(o.active_tenants) },
  ];

  const healthItems = [
    {
      label: "Maintenance mode",
      value: health.maintenance_mode ? "On" : "Off",
      tone: health.maintenance_mode ? "clay" : "olive",
    },
    {
      label: "Last backup",
      value: health.backup_status
        ? `${health.backup_status} · ${dateOnly(health.backup_at)}`
        : "Never",
      tone: health.backup_status === "completed" ? "olive" : "sand",
    },
    {
      label: "Backup schedule",
      value: health.backup_schedule || "None",
      tone: health.backup_schedule === "active" ? "olive" : "steel",
    },
    {
      label: "Open anomalies",
      value: fmt(o.open_anomalies),
      tone: Number(o.open_anomalies) > 0 ? "sand" : "olive",
    },
    {
      label: "Anomalies, 7 days",
      value: fmt(health.anomalies_7d),
      tone: Number(health.anomalies_7d) > 0 ? "sand" : "olive",
    },
    {
      label: "Security events, 7 days",
      value: `${fmt(health.security_events_7d)} / ${fmt(
        health.security_events_total,
      )}`,
      tone: Number(health.security_events_7d) > 0 ? "clay" : "olive",
    },
    {
      label: "Integrations",
      value: fmt(o.integrations),
      tone: Number(o.integrations) > 0 ? "olive" : "steel",
    },
    {
      label: "Storefronts",
      value: fmt(o.storefronts),
      tone: Number(o.storefronts) > 0 ? "olive" : "steel",
    },
  ];

  return (
    <Layout title="App analytics">
      <div className="p-4 sm:p-6 space-y-8">
        <PageHeader
          index="A1"
          eyebrow="Control center"
          title="App analytics"
          description="The owner view: every tenant account combined — platform revenue, growth, activity and system health."
          meta={
            health.platform_name
              ? `${health.platform_name} · ${dateTime(data.generated_at)}`
              : undefined
          }
          actions={
            <>
              <Link
                href="/admin-users"
                className="px-4 py-2 rounded-lg bg-ground-secondary border hairline text-sm hover:border-amber/50"
              >
                <UserCog size={16} className="inline mr-2" />
                Users
              </Link>
              <Link
                href="/admin-settings"
                className="px-4 py-2 rounded-lg bg-amber text-ground text-sm font-semibold"
              >
                <Settings size={16} className="inline mr-2" />
                Settings
              </Link>
            </>
          }
        />

        <Ledger items={ledger} />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric
            icon={Users}
            label="Total users"
            value={fmt(o.users)}
            tone="bg-ember-500"
          />
          <Metric
            icon={Activity}
            label="Logins, 30 days"
            value={fmt(o.logins)}
            tone="bg-amber"
          />
          <Metric
            icon={UserCog}
            label="New users, 30 days"
            value={fmt(o.new_users)}
            tone="bg-olive"
          />
          <Metric
            icon={ShieldCheck}
            label="Administrators"
            value={fmt(o.admins)}
            tone="bg-steel"
          />
          <Metric
            icon={Store}
            label="Storefronts"
            value={fmt(o.storefronts)}
            tone="bg-ember-300"
          />
          <Metric
            icon={Package}
            label="Products"
            value={fmt(o.products)}
            tone="bg-steel"
          />
          <Metric
            icon={Star}
            label="Reviews"
            value={fmt(o.reviews)}
            tone="bg-sand"
          />
          <Metric
            icon={AlertTriangle}
            label="Open anomalies"
            value={fmt(o.open_anomalies)}
            tone="bg-clay"
          />
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
          <Section
            eyebrow="Platform revenue"
            title="Revenue and orders, 12 months"
          >
            <div className="px-2 pt-3 pb-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trend}
                  margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
                >
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis
                    yAxisId="left"
                    {...axisProps}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    width={48}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    {...axisProps}
                    width={36}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="MAD" />}
                    cursor={tooltipCursor}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Revenue"
                    fill={CHART.ember}
                    radius={[2, 2, 0, 0]}
                    barSize={16}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="orders"
                    name="Orders"
                    stroke={CHART.sand}
                    strokeWidth={2}
                    dot={{ r: 2, fill: CHART.sand }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section eyebrow="Access" title="User roles">
            <div className="px-2 pt-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.roles}
                      dataKey="count"
                      nameKey="role"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {(data.roles || []).map((entry, index) => (
                        <Cell
                          key={entry.role}
                          fill={SERIES[index % SERIES.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3 mb-1">
                {(data.roles || []).map((role, index) => (
                  <div key={role.role} className="flex justify-between text-sm">
                    <span className="text-ink-2">
                      <span
                        aria-hidden="true"
                        className="inline-block w-[5px] h-[5px] me-2 align-middle"
                        style={{
                          background: SERIES[index % SERIES.length],
                        }}
                      />
                      {role.role}
                    </span>
                    <strong className="font-mono tabular-nums">
                      {role.count}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <Section eyebrow="Growth" title="Signups and logins, 12 months">
          <div className="px-2 pt-3 pb-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
              >
                <EmberAreaFill />
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />
                <Area
                  type="monotone"
                  dataKey="signups"
                  name="Signups"
                  stroke={CHART.ember}
                  strokeWidth={2}
                  fill={emberUrl()}
                />
                <Area
                  type="monotone"
                  dataKey="logins"
                  name="Logins"
                  stroke={CHART.dim}
                  strokeWidth={1.5}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <div className="grid lg:grid-cols-2 gap-5">
          <Section eyebrow="Activity" title="Recent signups">
            <NoirTable
              rowKey="id"
              emptyLabel="No users yet"
              columns={[
                { key: "name", label: "Name" },
                {
                  key: "company",
                  label: "Company",
                  render: (row) => row.company || "—",
                },
                {
                  key: "role",
                  label: "Role",
                  render: (row) => (
                    <Status
                      tone={
                        row.role === "admin"
                          ? "ember"
                          : row.role === "manager"
                            ? "sand"
                            : "steel"
                      }
                    >
                      {row.role}
                    </Status>
                  ),
                },
                {
                  key: "created_at",
                  label: "Joined",
                  render: (row) => (
                    <span className="font-mono text-[13px] text-ink-2">
                      {dateOnly(row.created_at)}
                    </span>
                  ),
                },
              ]}
              rows={activity.signups}
            />
          </Section>

          <Section eyebrow="Activity" title="Recent logins">
            <NoirTable
              emptyLabel="No logins yet"
              columns={[
                { key: "name", label: "Name" },
                {
                  key: "success",
                  label: "Result",
                  render: (row) => (
                    <Status tone={row.success ? "olive" : "clay"}>
                      {row.success ? "success" : "failed"}
                    </Status>
                  ),
                },
                {
                  key: "ip_address",
                  label: "IP",
                  render: (row) => (
                    <span className="font-mono text-[13px] text-ink-2">
                      {row.ip_address || "—"}
                    </span>
                  ),
                },
                {
                  key: "login_time",
                  label: "Time",
                  render: (row) => (
                    <span className="font-mono text-[13px] text-ink-2">
                      {dateTime(row.login_time)}
                    </span>
                  ),
                },
              ]}
              rows={activity.logins}
            />
          </Section>
        </div>

        <Section eyebrow="System health" title="Platform status">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
            {healthItems.map((item) => (
              <div
                key={item.label}
                className="bg-surface px-4 py-4 flex flex-col gap-2"
              >
                <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-ink-2 antialiased">
                  {item.label}
                </p>
                <p className="flex items-center gap-2">
                  <Status tone={item.tone}>{item.value}</Status>
                </p>
              </div>
            ))}
          </div>
        </Section>

        <section className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="portal-heading text-lg">Administration</h2>
              <p className="portal-text mt-1">
                Manage access and platform behavior from one place.
              </p>
            </div>
            <Link
              href="/admin-users"
              className="text-amber text-sm font-semibold"
            >
              Open user management
              <ArrowRight size={15} className="inline ml-1" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
