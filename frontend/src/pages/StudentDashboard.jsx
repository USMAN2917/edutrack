import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { getAssignments, getStats, submitAssignment } from "../api/client";

const C = {
  bg: "#0a0e1a", surface: "#111827", card: "#1a2235", border: "#1e2d45",
  accent: "#4f8ef7", accentGlow: "rgba(79,142,247,0.12)",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", purple: "#a855f7",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#4a5568",
};

const Badge = ({ label, color }) => (
  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
);

const priorityColor = (p) => ({ HIGH: C.red, MEDIUM: C.amber, LOW: C.green }[p] || C.textMuted);
const statusColor = (s) => ({ SUBMITTED: C.green, PENDING: C.amber, LATE: C.red }[s] || C.textMuted);

const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("all");
  const [subject, setSubject] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [a, s] = await Promise.all([getAssignments(), getStats()]);
      setAssignments(a);
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const subjects = [...new Set(assignments.map(a => a.subject))];

  const myAssignments = assignments.map(a => ({
    ...a,
    mySub: a.submissions?.find(s => s.studentId === user?.id || s.student?.id === user?.id)
  }));

  const filtered = myAssignments.filter(a => {
    if (subject !== "all" && a.subject !== subject) return false;
    if (filter === "pending") return a.mySub?.status !== "SUBMITTED";
    if (filter === "submitted") return a.mySub?.status === "SUBMITTED";
    if (filter === "graded") return !!a.mySub?.grade;
    return true;
  });

  const handleSubmit = async (assignmentId) => {
    setSubmitting(true);
    try {
      await submitAssignment(assignmentId);
      await load();
      setSelected(null);
    } catch (e) { alert("Error submitting: " + (e.response?.data?.error || e.message)); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Syne', sans-serif", fontSize: 18 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 12 }}>
          <span style={{ color: C.accent, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif", letterSpacing: 2 }}>🎓 EduTrack</span>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>Student · Batch {user?.batch}</div>
          </div>
          <button onClick={logout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ color: C.textPrimary, fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
        <p style={{ color: C.textSecondary, margin: "0 0 28px" }}>Here's your academic workload.</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { icon: "📚", label: "Total", val: stats.total || 0, color: C.accent },
            { icon: "⏳", label: "Pending", val: stats.pending || 0, color: C.amber },
            { icon: "✅", label: "Submitted", val: stats.submitted || 0, color: C.green },
            { icon: "🏆", label: "Graded", val: stats.graded || 0, color: C.purple },
          ].map(({ icon, label, val, color }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
              <div>
                <div style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                <div style={{ color, fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        {stats.total > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.textPrimary, fontWeight: 700 }}>Overall Progress</span>
              <span style={{ color: C.accent, fontWeight: 700 }}>{Math.round(((stats.submitted || 0) / stats.total) * 100)}%</span>
            </div>
            <div style={{ background: C.surface, borderRadius: 8, height: 8 }}>
              <div style={{ width: `${((stats.submitted || 0) / stats.total) * 100}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.purple})`, height: "100%", borderRadius: 8, transition: "width 0.6s" }} />
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.textPrimary, fontSize: 13, cursor: "pointer", outline: "none" }}>
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {["all", "pending", "submitted", "graded"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "9px 18px", borderRadius: 10, border: `1px solid ${filter === f ? C.accent : C.border}`,
              background: filter === f ? C.accentGlow : "transparent",
              color: filter === f ? C.accent : C.textSecondary,
              fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
            }}>{f}</button>
          ))}
        </div>

        {/* Assignment Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: C.textMuted }}>
              <div style={{ fontSize: 48 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>All caught up!</div>
            </div>
          )}
          {filtered.map(a => {
            const days = daysLeft(a.dueDate);
            return (
              <div key={a.id} onClick={() => setSelected(a)} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
                cursor: "pointer", transition: "border-color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + "66"}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge label={a.subject} color={C.accent} />
                    <Badge label={a.priority} color={priorityColor(a.priority)} />
                    {a.mySub && <Badge label={a.mySub.status} color={statusColor(a.mySub.status)} />}
                  </div>
                  <div style={{ color: days < 0 ? C.red : days <= 2 ? C.amber : C.textMuted, fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8, textAlign: "right" }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today!" : `${days}d left`}
                  </div>
                </div>
                <h3 style={{ color: C.textPrimary, margin: "0 0 8px", fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{a.title}</h3>
                <p style={{ color: C.textSecondary, fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>{a.description?.slice(0, 80)}...</p>
                {a.mySub?.status === "SUBMITTED" ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {a.mySub.grade && <span style={{ color: C.green, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>{a.mySub.grade}</span>}
                    {!a.mySub.grade && <Badge label="Awaiting grade" color={C.amber} />}
                    {a.mySub.feedback && <span style={{ color: C.textSecondary, fontSize: 12, fontStyle: "italic" }}>"{a.mySub.feedback}"</span>}
                  </div>
                ) : (
                  <button onClick={e => { e.stopPropagation(); handleSubmit(a.id); }} disabled={submitting}
                    style={{ background: `${C.green}22`, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 8, padding: "7px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                    ✓ Submit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 30, maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <Badge label={selected.subject} color={C.accent} />
                  <Badge label={selected.priority} color={priorityColor(selected.priority)} />
                </div>
                <h2 style={{ color: C.textPrimary, margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 20 }}>{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ background: C.surface, borderRadius: 12, padding: 16, color: C.textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{selected.description}</div>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>
              Due: <strong style={{ color: C.textSecondary }}>{new Date(selected.dueDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</strong>
            </div>
            {selected.mySub?.status === "SUBMITTED" ? (
              <div style={{ textAlign: "center", padding: 24, background: C.surface, borderRadius: 12 }}>
                <div style={{ fontSize: 36 }}>✅</div>
                <div style={{ color: C.green, fontWeight: 700, fontSize: 16, margin: "8px 0" }}>Submitted!</div>
                {selected.mySub.grade && <div style={{ color: C.textPrimary }}>Grade: <strong style={{ color: C.green, fontSize: 22, fontFamily: "'Syne', sans-serif" }}>{selected.mySub.grade}</strong></div>}
                {selected.mySub.feedback && <div style={{ color: C.textSecondary, fontSize: 13, marginTop: 8, fontStyle: "italic" }}>"{selected.mySub.feedback}"</div>}
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <button onClick={() => handleSubmit(selected.id)} disabled={submitting}
                  style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Syne', sans-serif" }}>
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
