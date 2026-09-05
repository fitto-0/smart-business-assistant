import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiRequest } from "../lib/api";
import { Search, Save, ShieldCheck } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    role: "user",
  });
  const load = () =>
    apiGet("/admin/users", { search })
      .then((data) => setUsers(data.users || []))
      .catch((err) => setMessage(err.message));
  useEffect(() => {
    load();
  }, []);
  const update = async (user) => {
    setMessage("");
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: { name: user.name, company: user.company, role: user.role },
      });
      setMessage("User updated");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };
  const createUser = async (event) => {
    event.preventDefault();
    try {
      await apiRequest("/admin/users", { method: "POST", body: newUser });
      setNewUser({
        name: "",
        email: "",
        company: "",
        password: "",
        role: "user",
      });
      setMessage("User created");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };
  return (
    <Layout title="User management">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <p className="portal-label text-amber">ACCESS CONTROL</p>
          <h1 className="portal-heading text-3xl mt-1">User management</h1>
          <p className="portal-text mt-2">
            Create accounts, assign roles, and review activity across every
            business.
          </p>
        </div>
        <form
          onSubmit={createUser}
          className="bg-ground-secondary border hairline rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <input
            required
            placeholder="Full name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <input
            placeholder="Company"
            value={newUser.company}
            onChange={(e) =>
              setNewUser({ ...newUser, company: e.target.value })
            }
            className="bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Temporary password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            className="bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <div className="flex gap-2">
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="bg-ground border hairline rounded-lg px-2 text-sm"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button className="px-3 rounded-lg bg-amber text-ground font-semibold text-sm">
              Create
            </button>
          </div>
        </form>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search size={17} className="absolute left-3 top-3 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search users, email, company"
              className="w-full bg-ground-secondary border hairline rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-amber"
            />
          </div>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-amber text-ground font-semibold text-sm"
          >
            Search
          </button>
        </div>
        {message && <p className="text-sm text-amber">{message}</p>}
        <div className="overflow-x-auto bg-ground-secondary border hairline rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b hairline">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Company</th>
                <th className="p-4">Role</th>
                <th className="p-4">Last login</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hairline last:border-0">
                  <td className="p-4 min-w-56">
                    <strong className="block">{user.name}</strong>
                    <span className="portal-label">{user.email}</span>
                  </td>
                  <td className="p-4">
                    <input
                      value={user.company || ""}
                      onChange={(e) =>
                        setUsers(
                          users.map((item) =>
                            item.id === user.id
                              ? { ...item, company: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="bg-transparent border-b border-transparent focus:border-amber outline-none py-1 w-44"
                    />
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        setUsers(
                          users.map((item) =>
                            item.id === user.id
                              ? { ...item, role: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="bg-ground border hairline rounded-md px-2 py-1.5"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-ink-secondary">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => update(user)}
                      className="text-amber font-semibold"
                    >
                      <Save size={16} className="inline mr-1" />
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-teal/10 border border-teal/30 rounded-xl p-4 text-sm text-ink-secondary">
          <ShieldCheck size={17} className="inline mr-2 text-teal" />
          <strong className="text-ink">Role difference:</strong> Users access
          only their own business data. Managers can be granted operational
          access as the product evolves. Admins access this control center, all
          tenant analytics, user roles, and system settings.
        </div>
      </div>
    </Layout>
  );
}
