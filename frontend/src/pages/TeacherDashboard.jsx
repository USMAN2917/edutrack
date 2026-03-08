import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { getAssignments, getStats, getStudents, createAssignment, deleteAssignment, gradeSubmission } from "../api/client";

const C = {
  bg: "#0a0e1a", surface: "#111827", card: "#1a2235", border: "#1e2d45",
  accent: "#4f8ef7", purple: "#a855f7",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#4a5568",
};

const SUBJECTS = ["Mathematics", "Physics", "Computer Science", "English Literature", "Chemistry", "History"];
const Badge = ({ label, color }) => (
  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
);
const priorityColor = p => ({ HIGH: C.red, MEDIUM: C.amber, LOW: C.green }[p]);
const statusColor = s => ({ SUBMITTED: C.green, PENDING: C.amber, LATE: C.red }[s]);
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000);

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("assignments");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gradeInputs, setGradeInputs] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", subject: SUBJECTS[0], description: "", dueDate: "", priority: "MEDIUM" });

  const load = async () => {
    try {
      const [a, s, st] = await Promise.all([getAssignments(), getStats(), getStudents()]);
      setAssignments(a); setStats(s); setStudents(st);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.dueDate) return alert("Title and due date required");
    setSubmitting(true);
    try {
      await createAssignment(form);
      await load();
      setShowCreate(false);
      setForm({ title: "", subject: SUBJECTS[0], description: "", dueDate: "", priority: "MEDIUM" });
    } catch (e) { alert(e.response?.data?.error || "Error creating assignment"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    try { await deleteAssignment(id); setSelected(null); await load(); } catch (e) { alert("Error deleting"); }
  };

  const handleGrade = async (assignmentId, studentId) => {
    const key = `${assignmentId}-${studentId}`;
    const grade = gradeInputs[key];
    const feedback = feedbackInputs[key];
    if (!grade) return alert("Enter a grade first");
    try {
      await gradeSubmission(assignmentId, studentId, grade, feedback);
      await load();
      setGradeInputs(p => { const n = {...p}; delete n[key]; return n; });
      setFeedbackInputs(p => { const n = {...p}; delete n[key]; return n; });
      // refresh selected
      if (selected?.id === assignmentId) {
        const updated = assignments.find(a => a.id === assignmentId);
        setSelected(updated);
      }
    } catch (e) { alert("Error grading"); }
  };

  const inputStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", color: C.textPrimary, fontSize: 13, outline: "none", fontFamily: "'Inter', sans-serif", width: "100%", boxSizing: "border-box" };

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
          <button onClick={() => setShowCreate(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 9, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>+ New Assignment</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>Teacher · {user?.subject}</div>
          </div>
          <button onClick={logout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.textSecondary, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ color: C.textPrimary, fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>Teacher Portal 👩‍🏫</h1>
        <p style={{ color: C.textSecondary, margin: "0 0 28px" }}>Manage assignments and track student progress.</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { icon: "📋", label: "Assignments", val: stats.assignments || 0, color: C.accent },
            { icon: "👥", label: "Students", val: stats.students || 0, color: C.purple },
            { icon: "📬", label: "Submitted", val: stats.submissions || 0, color: C.green },
            { icon: "⚠️", label: "To Grade", val: stats.ungraded || 0, color: C.amber },
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

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.surface, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, width: "fit-content" }}>
          {[["assignments", "📋 Assignments"], ["students", "👥 Students"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "9px 22px", borderRadius: 9, border: "none", cursor: "pointer",
              background: tab === t ? C.accent : "transparent",
              color: tab === t ? "#fff" : C.textSecondary,
              fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* ASSIGNMENTS TAB */}
        {tab === "assignments" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {assignments.map(a => {
              const submitted = a.submissions?.filter(s => s.status === "SUBMITTED").length || 0;
              const total = a.submissions?.length || 0;
              const days = daysLeft(a.dueDate);
              return (
                <div key={a.id} onClick={() => setSelected(a)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + "66"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge label={a.subject} color={C.accent} />
                      <Badge label={a.priority} color={priorityColor(a.priority)} />
                    </div>
                    <div style={{ color: days < 0 ? C.red : days <= 2 ? C.amber : C.textMuted, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </div>
                  </div>
                  <h3 style={{ color: C.textPrimary, margin: "0 0 8px", fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{a.title}</h3>
                  <p style={{ color: C.textSecondary, fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>{a.description?.slice(0, 80)}...</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, background: C.surface, borderRadius: 6, height: 6 }}>
                      <div style={{ width: total ? `${(submitted / total) * 100}%` : "0%", background: C.accent, height: "100%", borderRadius: 6 }} />
                    </div>
                    <span style={{ color: C.textSecondary, fontSize: 12 }}>{submitted}/{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STUDENTS TAB */}
        {tab === "students" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {students.map(s => {
              const subs = assignments.flatMap(a => a.submissions?.filter(sub => sub.studentId === s.id || sub.student?.id === s.id) || []);
              const submitted = subs.filter(sub => sub.status === "SUBMITTED").length;
              const graded = subs.filter(sub => sub.grade).length;
              return (
                <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${C.accent}22`, border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: C.accent }}>{s.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                      <div style={{ color: C.textMuted, fontSize: 12 }}>{s.email}</div>
                    </div>
                    {s.batch && <Badge label={`Batch ${s.batch}`} color={C.accent} />}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center", marginBottom: 12 }}>
                    {[{ l: "Assigned", v: subs.length, c: C.textSecondary }, { l: "Submitted", v: submitted, c: C.green }, { l: "Graded", v: graded, c: C.purple }].map(({ l, v, c }) => (
                      <div key={l} style={{ background: C.surface, borderRadius: 10, padding: "10px 4px" }}>
                        <div style={{ color: c, fontWeight: 800, fontSize: 20, fontFamily: "'Syne', sans-serif" }}>{v}</div>
                        <div style={{ color: C.textMuted, fontSize: 10, textTransform: "uppercase" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.textMuted, fontSize: 11 }}>Completion</span>
                      <span style={{ color: C.accent, fontSize: 11, fontWeight: 700 }}>{subs.length ? Math.round((submitted / subs.length) * 100) : 0}%</span>
                    </div>
                    <div style={{ background: C.border, borderRadius: 6, height: 6 }}>
                      <div style={{ width: `${subs.length ? (submitted / subs.length) * 100 : 0}%`, background: C.accent, height: "100%", borderRadius: 6 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 30, maxWidth: 620, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
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
            <div style={{ background: C.surface, borderRadius: 12, padding: 14, color: C.textSecondary, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{selected.description}</div>
            <h4 style={{ color: C.textPrimary, margin: "0 0 12px", fontFamily: "'Syne', sans-serif" }}>Student Submissions</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selected.submissions?.map(sub => {
                const student = sub.student || students.find(s => s.id === sub.studentId);
                if (!student) return null;
                const key = `${selected.id}-${student.id}`;
                return (
                  <div key={sub.studentId || sub.student?.id} style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: sub.status === "SUBMITTED" && !sub.grade ? 10 : 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.accent}22`, border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accent }}>{student.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 13 }}>{student.name}</div>
                        <div style={{ color: C.textMuted, fontSize: 11 }}>{sub.submittedAt ? `Submitted ${new Date(sub.submittedAt).toLocaleDateString()}` : "Not submitted"}</div>
                      </div>
                      <Badge label={sub.status} color={statusColor(sub.status)} />
                      {sub.grade && <span style={{ color: C.green, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>{sub.grade}</span>}
                    </div>
                    {sub.status === "SUBMITTED" && !sub.grade && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={gradeInputs[key] || ""} onChange={e => setGradeInputs(p => ({ ...p, [key]: e.target.value }))} placeholder="Grade (A, B+...)" style={{ ...inputStyle, maxWidth: 120 }} />
                        <input value={feedbackInputs[key] || ""} onChange={e => setFeedbackInputs(p => ({ ...p, [key]: e.target.value }))} placeholder="Feedback..." style={inputStyle} />
                        <button onClick={() => handleGrade(selected.id, student.id)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Grade</button>
                      </div>
                    )}
                    {sub.feedback && <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 8, fontStyle: "italic" }}>💬 "{sub.feedback}"</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button onClick={() => handleDelete(selected.id)} style={{ background: `${C.red}22`, color: C.red, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Delete Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 30, maxWidth: 500, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ color: C.textPrimary, margin: 0, fontFamily: "'Syne', sans-serif" }}>📋 New Assignment</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[["Title *", "title", "text", "Assignment title..."]].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ color: C.textSecondary, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: C.textSecondary, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>Subject</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: C.textSecondary, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: C.textSecondary, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: C.textSecondary, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the assignment..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <button onClick={handleCreate} disabled={submitting} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Syne', sans-serif" }}>
                {submitting ? "Creating..." : "Create Assignment →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
