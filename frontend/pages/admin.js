import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { apiGet } from "../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
} from "lucide-react";

const fmt = (value) =>
  new Intl.NumberFormat("fr-FR").format(Number(value || 0));
const COLORS = ["#e8913c", "#2e6b72", "#7c8cf8"];

function Metric({ icon: Icon, label, value, tone = "bg-teal" }) {
  return (
    <div className="bg-ground-secondary border hairline rounded-xl p-5 flex items-center gap-4">
      <div
        className={`${tone} w-11 h-11 rounded-xl flex items-center justify-center`}
      >
        <Icon size={21} className="text-ground" />
      </div>
      <div>
        <p className="portal-label">{label}</p>
        <p className="portal-heading text-2xl mt-1">{fmt(value)}</p>
      </div>
    </div>
  );
}

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
      <Layout title="Admin dashboard">
        <div className="p-6 text-red-400">{error}</div>
      </Layout>
    );
  if (!data)
    return (
      <Layout title="Admin dashboard">
        <div className="p-6 portal-text">Loading...</div>
      </Layout>
    );
  const o = data.overview;
  return (
    <Layout title="Admin dashboard">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="portal-label text-amber">CONTROL CENTER</p>
            <h1 className="portal-heading text-3xl mt-1">System overview</h1>
            <p className="portal-text mt-2">
              One view of users, platform activity, and business health.
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric icon={Users} label="Total users" value={o.users} />
          <Metric
            icon={Activity}
            label="Logins, 30 days"
            value={o.logins}
            tone="bg-amber"
          />
          <Metric
            icon={Coins}
            label="Platform revenue"
            value={`${fmt(o.revenue)} DA`}
            tone="bg-indigo-500"
          />
          <Metric
            icon={ShieldCheck}
            label="Administrators"
            value={o.admins}
            tone="bg-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric
            icon={Package}
            label="Products"
            value={o.products}
            tone="bg-sky-600"
          />
          <Metric
            icon={Star}
            label="Reviews"
            value={o.reviews}
            tone="bg-yellow-500"
          />
          <Metric
            icon={AlertTriangle}
            label="Open anomalies"
            value={o.open_anomalies}
            tone="bg-red-500"
          />
          <Metric
            icon={Users}
            label="New users, 30 days"
            value={o.new_users}
            tone="bg-pink-600"
          />
        </div>
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
          <section className="bg-ground-secondary border hairline rounded-xl p-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="portal-heading text-lg">Revenue and orders</h2>
                <p className="portal-label mt-1">All tenant accounts</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#172126",
                      border: "1px solid #334155",
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#e8913c"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="orders"
                    name="Orders"
                    fill="#2e6b72"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="bg-ground-secondary border hairline rounded-xl p-5">
            <h2 className="portal-heading text-lg">User roles</h2>
            <p className="portal-label mt-1">Current access distribution</p>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.roles}
                    dataKey="count"
                    nameKey="role"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {data.roles.map((entry, index) => (
                      <Cell
                        key={entry.role}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#172126",
                      border: "1px solid #334155",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.roles.map((role, index) => (
                <div key={role.role} className="flex justify-between text-sm">
                  <span className="text-ink-secondary">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    {role.role}
                  </span>
                  <strong>{role.count}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex justify-between items-center">
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
