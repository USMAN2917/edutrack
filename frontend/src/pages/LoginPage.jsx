import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const C = {
  bg: "#0a0e1a", surface: "#111827", card: "#1a2235", border: "#1e2d45",
  accent: "#4f8ef7", textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#4a5568",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "TEACHER" ? "/teacher" : "/student");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "student") { setEmail("priya@college.edu"); setPassword("password123"); }
    else { setEmail("kavita@college.edu"); setPassword("password123"); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h1 style={{ color: C.textPrimary, fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, margin: 0 }}>EduTrack</h1>
          <p style={{ color: C.textSecondary, margin: "8px 0 0" }}>Sign in to your account</p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
          {error && (
            <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ color: C.textSecondary, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@college.edu"
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div>
              <label style={{ color: C.textSecondary, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "'Syne', sans-serif" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            <div style={{ color: C.textMuted, fontSize: 11, textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Quick Demo Login</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => fillDemo("student")} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>👨‍🎓 Student</button>
              <button onClick={() => fillDemo("teacher")} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>👩‍🏫 Teacher</button>
            </div>
          </div>

          <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, marginTop: 20, marginBottom: 0 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: C.accent, textDecoration: "none", fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
