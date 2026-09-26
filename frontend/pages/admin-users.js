import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiRequest } from "../lib/api";
import { getUser } from "../lib/auth";
import { Search, Save, ShieldCheck, Pencil, Trash2, X } from "lucide-react";

const emptyUser = { name: "", email: "", company: "", password: "", role: "user" };
const inputClass =
  "w-full bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyUser);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [modalError, setModalError] = useState("");
  const [newUser, setNewUser] = useState(emptyUser);

  const notify = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const load = () =>
    apiGet("/admin/users", { search })
      .then((data) => setUsers(data.users || []))
      .catch((err) => notify(err.message, true));

  useEffect(() => {
    const me = getUser();
    setCurrentUserId(me ? me.id : null);
    load();
  }, []);

  const update = async (user) => {
    notify("");
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: { name: user.name, company: user.company, role: user.role },
      });
      notify("User updated");
      load();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    try {
      await apiRequest("/admin/users", { method: "POST", body: newUser });
      setNewUser(emptyUser);
      notify("User created");
      load();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const openEdit = (user) => {
    setEditing(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      company: user.company || "",
      role: user.role || "user",
      password: "",
    });
    setModalError("");
    notify("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setModalError("");
    try {
      const body = {
        name: editForm.name,
        email: editForm.email,
        company: editForm.company,
        role: editForm.role,
      };
      if (editForm.password) body.password = editForm.password;
      await apiRequest(`/admin/users/${editing.id}`, { method: "PATCH", body });
      setEditing(null);
      notify("User updated");
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async () => {
    setSaving(true);
    setModalError("");
    try {
      await apiRequest(`/admin/users/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      notify("User deleted");
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
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
            className={inputClass}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Company"
            value={newUser.company}
            onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
            className={inputClass}
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
            className={inputClass}
          />
          <div className="flex gap-2">
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className={`${inputClass} flex-1`}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button className="px-4 rounded-lg bg-amber text-ground font-semibold text-sm">
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
        {message && (
          <p className={`text-sm ${isError ? "text-clay" : "text-amber"}`}>
            {message}
          </p>
        )}
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
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => update(user)}
                        className="text-amber font-semibold"
                      >
                        <Save size={16} className="inline mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="text-ink-2 font-semibold hover:text-ink"
                        title="Edit user"
                      >
                        <Pencil size={16} className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleting(user);
                          setModalError("");
                          notify("");
                        }}
                        disabled={user.id === currentUserId}
                        title={
                          user.id === currentUserId
                            ? "You cannot delete your own account"
                            : "Delete user"
                        }
                        className={`font-semibold ${
                          user.id === currentUserId
                            ? "text-ink-3 cursor-not-allowed"
                            : "text-clay hover:opacity-80"
                        }`}
                      >
                        <Trash2 size={16} className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-3">
                    No users found
                  </td>
                </tr>
              )}
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

      {/* ---- Edit user ---- */}
      {editing && (
        <div className="fixed inset-0 modal-scrim flex items-center justify-center z-50 p-4">
          <form
            onSubmit={saveEdit}
            className="modal-card bg-surface border hairline rounded-xs p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="portal-label text-amber">EDIT USER</p>
                <h3 className="portal-heading text-lg mt-1">{editing.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-xs flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 border hairline"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="portal-label">Full name</span>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="portal-label">Email</span>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="portal-label">Company</span>
                <input
                  value={editForm.company}
                  onChange={(e) =>
                    setEditForm({ ...editForm, company: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="portal-label">Role</span>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="portal-label">
                  New password — leave empty to keep the current one
                </span>
                <input
                  type="password"
                  minLength={6}
                  placeholder="Unchanged"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className={`mt-2 ${inputClass}`}
                />
              </label>
            </div>

            {modalError && (
              <p className="mt-4 text-sm text-clay">{modalError}</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border hairline text-ink-2 font-semibold text-sm hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber text-ground font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---- Delete user ---- */}
      {deleting && (
        <div className="fixed inset-0 modal-scrim flex items-center justify-center z-50 p-4">
          <div className="modal-card bg-surface border hairline rounded-xs p-6 w-full max-w-md">
            <p className="portal-label text-clay">DELETE USER</p>
            <h3 className="portal-heading text-lg mt-1 mb-2">
              Delete {deleting.name}?
            </h3>
            <p className="portal-text text-sm">
              {deleting.email} and all of their business data (products, sales,
              reviews, settings) will be removed permanently. This cannot be
              undone.
            </p>
            {modalError && (
              <p className="mt-4 text-sm text-clay">{modalError}</p>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 rounded-lg border hairline text-ink-2 font-semibold text-sm hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                onClick={deleteForm}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-clay text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
