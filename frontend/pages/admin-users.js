import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiRequest } from "../lib/api";
import { getUser } from "../lib/auth";
import { Search, Save, ShieldCheck, Pencil, Trash2, X, Building2 } from "lucide-react";

const emptyUser = { name: "", email: "", company: "", password: "", role: "user" };
const inputClass =
  "w-full bg-ground border hairline rounded-lg px-3 py-2 text-sm outline-none focus:border-amber";

const ROLE_OPTIONS = [
  {
    value: "user",
    title: "User",
    desc: "Their own business only — dashboard, sales, products and storefront. No access to other accounts.",
  },
  {
    value: "manager",
    title: "Manager",
    desc: "Everything a user can, plus managing people and platform settings. No platform analytics, and never any access to admin accounts.",
  },
  {
    value: "admin",
    title: "Admin",
    desc: "Owner of the platform — every account, app analytics and system settings.",
  },
];

/* Organization (tenant) roles — used by managers inside their own organization. */
const ORG_ROLE_OPTIONS = [
  {
    value: "employee",
    title: "Employee",
    desc: "Day-to-day work — sales, products and storefront for this organization.",
  },
  {
    value: "accountant",
    title: "Accountant",
    desc: "Books and reports — sees the numbers, never manages people.",
  },
  {
    value: "viewer",
    title: "Viewer",
    desc: "Read-only — can look at dashboards and reports, changes nothing.",
  },
  {
    value: "manager",
    title: "Manager",
    desc: "Runs this organization's people and settings — still inside this organization only.",
  },
  {
    value: "admin",
    title: "Org admin",
    desc: "Full control inside this organization — never a platform admin, never sees app analytics.",
  },
];

const orgRoleLabel = (value) => {
  const option = ORG_ROLE_OPTIONS.find((o) => o.value === value);
  if (option) return option.title;
  if (value === "owner") return "Owner";
  return value || "—";
};

/* Role explainer cards — used as the actual role control in create + edit. */
function RoleCards({ options, value, onChange }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`text-start rounded-xs border px-3 py-3 transition-colors duration-150 ${
              active
                ? "border-amber bg-surface-2"
                : "border-line hover:bg-surface"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="portal-label">{option.title}</span>
              <span
                aria-hidden="true"
                className={`w-[5px] h-[5px] shrink-0 ${
                  active ? "bg-amber" : "bg-line"
                }`}
              />
            </span>
            <span className="block mt-1.5 text-[13px] leading-snug text-ink-2">
              {option.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [scope, setScope] = useState("platform");
  const [organization, setOrganization] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
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
      .then((data) => {
        setUsers(data.users || []);
        setScope(data.scope || "platform");
        setOrganization(data.organization || null);
      })
      .catch((err) => notify(err.message, true));

  useEffect(() => {
    const me = getUser();
    setCurrentUserId(me ? me.id : null);
    setCurrentRole(me ? me.role : null);
    load();
  }, []);

  /* Managers only ever see their own organization — app roles never apply here. */
  const isOrgScope = scope === "organization";
  /* Platform admins manage app roles; managers never touch admin accounts. */
  const canAssignAdmin = currentRole !== "manager" && !isOrgScope;
  const isProtected = (user) =>
    !isOrgScope && currentRole === "manager" && user.role === "admin";
  const roleOptions = isOrgScope
    ? ORG_ROLE_OPTIONS
    : ROLE_OPTIONS.filter((o) => canAssignAdmin || o.value !== "admin");

  const update = async (user) => {
    notify("");
    try {
      const body = isOrgScope
        ? { name: user.name, company: user.company, orgRole: user.org_role }
        : { name: user.name, company: user.company, role: user.role };
      await apiRequest(`/admin/users/${user.id}`, { method: "PATCH", body });
      notify("User updated");
      load();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    try {
      const body = isOrgScope
        ? { ...newUser, role: "user", orgRole: newUser.orgRole || "employee" }
        : newUser;
      await apiRequest("/admin/users", { method: "POST", body });
      setNewUser({ ...emptyUser, orgRole: "employee" });
      notify(isOrgScope ? "Member added to your organization" : "User created");
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
      orgRole: user.org_role || "employee",
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
      const body = isOrgScope
        ? {
            name: editForm.name,
            email: editForm.email,
            company: editForm.company,
            orgRole: editForm.orgRole,
          }
        : {
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
    <Layout title={isOrgScope ? "Organization members" : "User management"}>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <p className="portal-label text-amber">ACCESS CONTROL</p>
          <h1 className="portal-heading text-3xl mt-1">
            {isOrgScope ? "Organization members" : "User management"}
          </h1>
          <p className="portal-text mt-2">
            {isOrgScope ? (
              <>
                Everyone inside <strong>{organization?.name || "your organization"}</strong> —
                add people and set their role within this organization. Platform
                accounts and app analytics belong to the platform admin.
              </>
            ) : (
              <>
                Create accounts, assign roles, and review activity across every
                business.
              </>
            )}
          </p>
        </div>
        <form
          onSubmit={createUser}
          className="bg-ground-secondary border hairline rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
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
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-end justify-between gap-4 pt-1">
            <div className="flex-1 min-w-[260px]">
              <p className="portal-label mb-2">
                {isOrgScope ? "Role in this organization" : "Role"}
              </p>
              <RoleCards
                options={roleOptions}
                value={isOrgScope ? newUser.orgRole || "employee" : newUser.role}
                onChange={(value) =>
                  isOrgScope
                    ? setNewUser({ ...newUser, orgRole: value })
                    : setNewUser({ ...newUser, role: value })
                }
              />
            </div>
            <button className="px-5 py-2.5 rounded-lg bg-amber text-ground font-semibold text-sm">
              {isOrgScope ? "Add member" : "Create account"}
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
              placeholder={
                isOrgScope ? "Search members, email, company" : "Search users, email, company"
              }
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
                <th className="p-4">{isOrgScope ? "Member" : "User"}</th>
                <th className="p-4">Company</th>
                <th className="p-4">
                  {isOrgScope ? "Organization role" : "Role"}
                </th>
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
                      disabled={isProtected(user)}
                      onChange={(e) =>
                        setUsers(
                          users.map((item) =>
                            item.id === user.id
                              ? { ...item, company: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="bg-transparent border-b border-transparent focus:border-amber outline-none py-1 w-44 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </td>
                  <td className="p-4">
                    {isProtected(user) ? (
                      <span className="portal-label text-ink-3">
                        Admin · protected
                      </span>
                    ) : isOrgScope && user.org_role === "owner" ? (
                      <span className="portal-label text-ink-3">Owner</span>
                    ) : isOrgScope ? (
                      <select
                        value={user.org_role || "employee"}
                        onChange={(e) =>
                          setUsers(
                            users.map((item) =>
                              item.id === user.id
                                ? { ...item, org_role: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="bg-ground border hairline rounded-md px-2 py-1.5"
                      >
                        {ORG_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    ) : (
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
                        {canAssignAdmin && <option value="admin">Admin</option>}
                      </select>
                    )}
                  </td>
                  <td className="p-4 text-ink-secondary">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="p-4">
                    {isProtected(user) ? (
                      <span className="portal-label text-ink-3">
                        Protected by admin
                      </span>
                    ) : (
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
                            : isOrgScope
                              ? "Remove from organization"
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
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-3">
                    {isOrgScope ? "No members found" : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <section className="bg-ground-secondary border hairline rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            {isOrgScope ? (
              <Building2 size={17} className="text-ember-500" />
            ) : (
              <ShieldCheck size={17} className="text-ember-500" />
            )}
            <h2 className="portal-heading text-lg">
              {isOrgScope ? "Roles in your organization" : "Roles, in plain words"}
            </h2>
          </div>
          <div
            className={
              isOrgScope ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" : "grid sm:grid-cols-3 gap-4"
            }
          >
            {(isOrgScope ? ORG_ROLE_OPTIONS : ROLE_OPTIONS).map((option) => (
              <div
                key={option.value}
                className="border hairline rounded-xs px-3 py-3 bg-surface"
              >
                <p className="portal-label">{option.title}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
                  {option.desc}
                </p>
              </div>
            ))}
          </div>
          {isOrgScope ? (
            <p className="portal-label mt-4 text-ink-3">
              These roles live inside your organization only. App-wide accounts
              and app analytics are handled by the platform admin.
            </p>
          ) : (
            !canAssignAdmin && (
              <p className="portal-label mt-4 text-clay">
                As a manager you can never create, edit, reset or delete an admin
                account.
              </p>
            )
          )}
        </section>
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
              <div className="sm:col-span-2">
                <span className="portal-label">
                  {isOrgScope ? "Role in this organization" : "Role"}
                </span>
                <div className="mt-2">
                  <RoleCards
                    options={roleOptions}
                    value={isOrgScope ? editForm.orgRole : editForm.role}
                    onChange={(value) =>
                      isOrgScope
                        ? setEditForm({ ...editForm, orgRole: value })
                        : setEditForm({ ...editForm, role: value })
                    }
                  />
                </div>
              </div>
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
              {isOrgScope ? "Remove " : "Delete "}
              {deleting.name}
              {isOrgScope ? " from your organization?" : "?"}
            </h3>
            <p className="portal-text text-sm">
              {isOrgScope ? (
                <>
                  {deleting.email} will lose access to your organization. Their
                  platform account is not deleted.
                </>
              ) : (
                <>
                  {deleting.email} and all of their business data (products, sales,
                  reviews, settings) will be removed permanently. This cannot be
                  undone.
                </>
              )}
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
                {saving ? "Deleting…" : isOrgScope ? "Remove member" : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
