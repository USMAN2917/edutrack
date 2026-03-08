// ─── DESIGN TOKENS ──────────────────────────────────────────────
export const C = {
  bg: '#0a0e1a', surface: '#111827', card: '#1a2235', border: '#1e2d45',
  accent: '#4f8ef7', accentGlow: 'rgba(79,142,247,0.15)',
  green: '#22c55e', amber: '#f59e0b', red: '#ef4444', purple: '#a855f7',
  text: '#f1f5f9', textSec: '#94a3b8', textMuted: '#4a5568',
}

export const priorityColor = (p) => ({ high: C.red, medium: C.amber, low: C.green }[p] || C.textMuted)
export const statusColor = (s) => ({ submitted: C.green, pending: C.amber, late: C.red }[s] || C.textMuted)

// ─── AVATAR ─────────────────────────────────────────────────────
export const Avatar = ({ initials = '??', color = C.accent, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, ${color}33, ${color}66)`,
    border: `2px solid ${color}44`, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color,
    flexShrink: 0, fontFamily: "'Syne', sans-serif",
  }}>{initials}</div>
)

// ─── BADGE ──────────────────────────────────────────────────────
export const Badge = ({ label, color }) => (
  <span style={{
    padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: `${color}22`, color, border: `1px solid ${color}44`,
    textTransform: 'uppercase', letterSpacing: 1,
  }}>{label}</span>
)

// ─── CARD ───────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
    padding: 24, transition: 'all 0.2s', cursor: onClick ? 'pointer' : 'default', ...style,
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = C.accent + '88')}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.border)}
  >{children}</div>
)

// ─── BUTTON ─────────────────────────────────────────────────────
export const Button = ({ children, onClick, variant = 'primary', size = 'md', style = {}, disabled, type = 'button' }) => {
  const styles = {
    primary: { background: C.accent, color: '#fff', border: 'none' },
    outline: { background: 'transparent', color: C.accent, border: `1px solid ${C.accent}44` },
    ghost: { background: 'transparent', color: C.textSec, border: 'none' },
    danger: { background: C.red + '22', color: C.red, border: `1px solid ${C.red}44` },
    success: { background: C.green + '22', color: C.green, border: `1px solid ${C.green}44` },
    purple: { background: C.purple + '22', color: C.purple, border: `1px solid ${C.purple}44` },
  }
  const sizes = { sm: '6px 14px', md: '10px 22px', lg: '13px 30px' }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...styles[variant], padding: sizes[size], borderRadius: 10, fontWeight: 600,
      fontSize: size === 'sm' ? 12 : 14, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, fontFamily: "'Syne', sans-serif", transition: 'all 0.2s', ...style,
    }}>{children}</button>
  )
}

// ─── INPUT ──────────────────────────────────────────────────────
export const Input = ({ value, onChange, placeholder, type = 'text', style = {}, required }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 14px', color: C.text, fontSize: 14, outline: 'none',
    fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', ...style,
  }}
    onFocus={e => e.target.style.borderColor = C.accent + '88'}
    onBlur={e => e.target.style.borderColor = C.border}
  />
)

// ─── SELECT ─────────────────────────────────────────────────────
export const Select = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={onChange} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 14px', color: C.text, fontSize: 14, outline: 'none',
    fontFamily: "'Inter', sans-serif", cursor: 'pointer', ...style,
  }}>{children}</select>
)

// ─── STAT CARD ──────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, color = C.accent, sub }) => (
  <Card style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14, background: `${color}18`,
      border: `1px solid ${color}33`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 22, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ color: C.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800, lineHeight: 1.1, fontFamily: "'Syne', sans-serif" }}>{value}</div>
      {sub && <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
)

// ─── NAVBAR ─────────────────────────────────────────────────────
export const Navbar = ({ profile, onSignOut, action }) => (
  <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
      <span style={{ color: C.accent, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif", letterSpacing: 2 }}>🎓 EduTrack</span>
      <div style={{ flex: 1 }} />
      {action}
      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={profile.avatar_initials} color={profile.role === 'teacher' ? C.purple : C.accent} size={34} />
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{profile.name}</div>
            <div style={{ color: C.textMuted, fontSize: 11, textTransform: 'capitalize' }}>{profile.role}{profile.batch ? ` · Batch ${profile.batch}` : ''}{profile.subject ? ` · ${profile.subject}` : ''}</div>
          </div>
        </div>
      )}
      <Button variant="ghost" onClick={onSignOut} size="sm">Sign Out</Button>
    </div>
  </div>
)

// ─── LOADING SPINNER ─────────────────────────────────────────────
export const Spinner = ({ label = 'Loading...' }) => (
  <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
    <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
    <div>{label}</div>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
)

// ─── ERROR BOX ───────────────────────────────────────────────────
export const ErrorBox = ({ message }) => message ? (
  <div style={{ background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 10, padding: '12px 16px', color: C.red, fontSize: 14, marginBottom: 16 }}>
    ⚠️ {message}
  </div>
) : null
