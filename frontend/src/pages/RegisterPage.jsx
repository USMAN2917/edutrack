import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const C = {
  bg: "#0a0e1a", surface: "#111827", card: "#1a2235", border: "#1e2d45",
  accent: "#4f8ef7", purple: "#a855f7", textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#4a5568",
};

const InputField = ({ label, type = "text", value, onChange, placeholder, required }) => (
  <div>
    <label style={{ color: C.textSecondary, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }} />
  </div>
);

const SUBJECTS = ["Mathematics", "Physics", "Computer Science", "English Literature", "Chemistry", "History"];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("STUDENT");
  const [form, setForm] = useState({ name: "", email: "", password: "", batch: "", subject: SUBJECTS[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(user.role === "TEACHER" ? "/teacher" : "/student");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h1 style={{ color: C.textPrimary, fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, margin: 0 }}>Join EduTrack</h1>
          <p style={{ color: C.textSecondary, margin: "8px 0 0" }}>Create your account</p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
          {/* Role Toggle */}
          <div style={{ display: "flex", background: C.surface, borderRadius: 12, padding: 4, marginBottom: 24, border: `1px solid ${C.border}` }}>
            {[["STUDENT", "👨‍🎓 Student"], ["TEACHER", "👩‍🏫 Teacher"]].map(([r, label]) => (
              <button key={r} type="button" onClick={() => setRole(r)} style={{
                flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer",
                background: role === r ? (r === "TEACHER" ? C.purple : C.accent) : "transparent",
                color: role === r ? "#fff" : C.textSecondary,
                fontWeight: 700, fontSize: 14, fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {error && (
            <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField label="Full Name" value={form.name} onChange={set("name")} placeholder="Your full name" required />
            <InputField label="Email" type="email" value={form.email} onChange={set("email")} placeholder="your@college.edu" required />
            <InputField label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required />

            {role === "STUDENT" && (
              <div>
                <label style={{ color: C.textSecondary, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Batch Year</label>
                <input value={form.batch} onChange={set("batch")} placeholder="e.g. 2024"
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }} />
              </div>
            )}

            {role === "TEACHER" && (
              <div>
                <label style={{ color: C.textSecondary, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Subject</label>
                <select value={form.subject} onChange={set("subject")}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: role === "TEACHER" ? C.purple : C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "'Syne', sans-serif", marginTop: 4 }}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, marginTop: 20, marginBottom: 0 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: C.accent, textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
