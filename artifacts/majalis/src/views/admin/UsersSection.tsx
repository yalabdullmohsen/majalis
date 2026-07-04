import { useEffect, useState } from "react";
import { adminGetUsers, adminUpdateUserRole } from "@/lib/supabase";
import { assignGovernanceRole, syncLegacyRoles, LEGACY_ROLE_MAP } from "@/lib/governance-service";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "./AdminShell";

const ROLES: Record<string, { label: string; bg: string; text: string }> = {
  admin:  { label: "مشرف",    bg: "#FEF3C7", text: "#92400E" },
  sheikh: { label: "شيخ",     bg: "#D1FAE5", text: C.emeraldDeep },
  user:   { label: "مستخدم",  bg: C.parchmentDeep, text: C.inkSoft },
};
const ROLE_OPTIONS = ["user", "sheikh", "admin"];
const ROLE_AR: Record<string, string> = { user: "مستخدم", sheikh: "شيخ", admin: "مشرف" };

const FILTERS: [string, string][] = [
  ["all", "الكل"], ["admin", "المشرفون"], ["sheikh", "المشايخ"], ["user", "المستخدمون"],
];

export function UsersSection() {
  const { showSuccess, showError } = useAdminShell();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminGetUsers().then(({ data }) => {  setUsers(data ?? []); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    syncLegacyRoles().catch(() => undefined);
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await adminUpdateUserRole(userId, newRole);
      if (error) {
        showError("تعذّر تغيير الصلاحية — تحقّق من صلاحياتك (RLS).");
        return;
      }
      const governanceRole = LEGACY_ROLE_MAP[newRole] || "read_only";
      try {
        await assignGovernanceRole(userId, governanceRole);
      } catch {
        /* governance table may not exist yet */
      }
      showSuccess("تم تحديث الصلاحية.");
    } catch {
      showError("تعذّر تغيير الصلاحية.");
    } finally {
      setUpdatingId(null);
      load();
    }
  };

  const filtered = users
    .filter(u => filter === "all" || u.role === filter)
    .filter(u => !search || (u.full_name || "").includes(search) || (u.city || "").includes(search));

  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === "admin").length,
    sheikh: users.filter(u => u.role === "sheikh").length,
    user: users.filter(u => u.role === "user").length,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
          المستخدمون ({users.length})
        </h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو المحافظة..."
          style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontSize: "0.875rem", fontFamily: "inherit", outline: "none", minWidth: "200px" }}
        />
      </div>

      {/* Role filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {FILTERS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${filter === v ? C.emerald : C.line}`, background: filter === v ? C.emerald : C.panel, color: filter === v ? C.parchment : C.inkSoft, cursor: "pointer", fontSize: "0.8125rem", fontFamily: "inherit" }}
          >
            {l} ({counts[v as keyof typeof counts]})
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["الاسم الكامل", "المحافظة", "النقاط", "المستوى", "تاريخ الانضمام", "الدور", "تغيير الدور"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const role = ROLES[u.role] || ROLES.user;
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600 }}>
                      {u.full_name || <span style={{ color: C.inkSoft, fontStyle: "italic" }}>بدون اسم</span>}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{u.city || "—"}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.brass, fontWeight: 700, textAlign: "center" }}>{u.points ?? 0}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, textAlign: "center" }}>{u.level ?? 1}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                      {new Date(u.created_at).toLocaleDateString("ar-KW")}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: role.bg, color: role.text, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {role.label}
                      </span>
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem" }}>
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontSize: "0.8125rem", fontFamily: "inherit", cursor: "pointer", opacity: updatingId === u.id ? 0.5 : 1 }}
                      >
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_AR[r]}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>
              {search ? "لا يوجد مستخدمون يطابقون البحث" : "لا يوجد مستخدمون مسجّلون"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
