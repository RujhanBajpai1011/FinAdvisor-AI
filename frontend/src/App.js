import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

// ============================================================
// DESIGN TOKENS
// ============================================================
const T = {
  // Blues - primary fintech palette
  blue50: "#EEF4FF",
  blue100: "#C7D9FF",
  blue400: "#4B8BFF",
  blue600: "#0F62FE",
  blue700: "#0043CE",
  blue900: "#001141",
  // Neutrals
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray800: "#1F2937",
  gray900: "#111827",
  // Semantic
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  teal: "#14B8A6",
  purple: "#8B5CF6",
};

// ============================================================
// MOCK DATA
// ============================================================
const assetAllocationData = [
  { name: "SIP/Mutual Funds", value: 35, color: T.blue600 },
  { name: "Property", value: 28, color: T.teal },
  { name: "Fixed Deposits", value: 18, color: T.purple },
  { name: "Gold", value: 12, color: T.amber },
  { name: "Cash", value: 7, color: T.gray400 },
];

const wealthGrowthData = [
  { month: "Jan", conservative: 2100000, moderate: 2100000, aggressive: 2100000 },
  { month: "Mar", conservative: 2180000, moderate: 2250000, aggressive: 2350000 },
  { month: "Jun", conservative: 2260000, moderate: 2420000, aggressive: 2680000 },
  { month: "Sep", conservative: 2340000, moderate: 2610000, aggressive: 3050000 },
  { month: "Dec", conservative: 2420000, moderate: 2800000, aggressive: 3400000 },
  { month: "Mar+1", conservative: 2500000, moderate: 3010000, aggressive: 3820000 },
];

const monthlyFlowData = [
  { month: "Jul", income: 100000, expenses: 62000, savings: 38000 },
  { month: "Aug", income: 100000, expenses: 58000, savings: 42000 },
  { month: "Sep", income: 112000, expenses: 64000, savings: 48000 },
  { month: "Oct", income: 100000, expenses: 71000, savings: 29000 },
  { month: "Nov", income: 100000, expenses: 68000, savings: 32000 },
  { month: "Dec", income: 135000, expenses: 95000, savings: 40000 },
];

// ============================================================
// UTILITY COMPONENTS
// ============================================================
const fmtINR = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

// SVG Icons (no external deps)
const Icons = {
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Chat: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  Guide: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Upload: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  Bot: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Trend: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 010-4h14v4"/><path d="M4 6v12a2 2 0 002 2h14v-4"/><circle cx="17" cy="12" r="1"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={T.blue600}/>
      <path d="M8 22L16 10L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 18h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ============================================================
// THEME HOOK
// ============================================================
const useTheme = () => {
  const [dark, setDark] = useState(false);
  const theme = {
    dark,
    toggle: () => setDark(p => !p),
    bg: dark ? "#0A0F1E" : "#F0F4FF",
    surface: dark ? "#111827" : "#FFFFFF",
    surface2: dark ? "#1A2236" : "#F8FAFF",
    border: dark ? "#1E293B" : "#E2E8F8",
    text: dark ? "#E8EDF8" : T.gray900,
    textMuted: dark ? "#8B9CC8" : T.gray600,
    blue: T.blue600,
    accent: dark ? "#2563EB" : T.blue600,
  };
  return theme;
};

// ============================================================
// GLOBAL STYLES
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #4B8BFF44; border-radius: 4px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .typing-dot { animation: pulse 1.2s ease infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px transparent inset !important; transition: background-color 5000s; }
  `}</style>
);

// ============================================================
// METRIC CARD COMPONENT
// ============================================================
const MetricCard = ({ label, value, sub, icon: Icon, color, theme }) => (
  <div className="fade-in" style={{
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    transition: "transform 0.2s",
    cursor: "default",
  }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, flexShrink: 0,
    }}>
      <Icon />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: T.green, fontWeight: 500, marginTop: 4 }}>{sub}</p>}
    </div>
  </div>
);

// ============================================================
// AUTH SCREENS
// ============================================================
const AuthScreen = ({ onLogin, theme }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.surface2, color: theme.text,
    fontSize: 14, outline: "none", transition: "border 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  };

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    // Simulate API call - in prod, POST to /auth/login
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onLogin({ name: name || email.split("@")[0], email });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: theme.bg, position: "relative", overflow: "hidden",
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: `${T.blue600}12`, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: `${T.teal}10`, filter: "blur(60px)" }} />

      <div className="fade-in" style={{
        width: "100%", maxWidth: 420, margin: "0 16px",
        background: theme.surface, borderRadius: 24,
        border: `1px solid ${theme.border}`,
        padding: "48px 40px",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <Icons.Logo />
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: theme.text }}>FinAdvisor AI</span>
          </div>
          <p style={{ color: theme.textMuted, fontSize: 14 }}>Your intelligent wealth companion</p>
        </div>

        {/* Tab */}
        <div style={{ display: "flex", background: theme.surface2, borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: mode === m ? theme.blue : "transparent",
                color: mode === m ? "white" : theme.textMuted,
                fontSize: 14, fontWeight: 500, transition: "all 0.2s",
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <input style={inputStyle} placeholder="Full Name" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => e.target.style.border = `1px solid ${T.blue600}`}
              onBlur={e => e.target.style.border = `1px solid ${theme.border}`} />
          )}
          <input style={inputStyle} type="email" placeholder="Email Address" value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={e => e.target.style.border = `1px solid ${T.blue600}`}
            onBlur={e => e.target.style.border = `1px solid ${theme.border}`} />
          <input style={inputStyle} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={e => e.target.style.border = `1px solid ${T.blue600}`}
            onBlur={e => e.target.style.border = `1px solid ${theme.border}`} />
        </div>

        {error && <p style={{ color: T.red, fontSize: 13, marginTop: 10 }}>{error}</p>}

        {mode === "login" && (
          <p style={{ textAlign: "right", fontSize: 13, color: T.blue600, cursor: "pointer", marginTop: 8 }}>Forgot Password?</p>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", marginTop: 20, padding: "14px",
            background: loading ? T.blue400 : T.blue600,
            border: "none", borderRadius: 10, color: "white",
            fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s, transform 0.1s",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => !loading && (e.target.style.background = T.blue700)}
          onMouseLeave={e => !loading && (e.target.style.background = T.blue600)}
        >
          {loading ? "Authenticating..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        <div style={{ marginTop: 20, padding: "14px 16px", background: theme.surface2, borderRadius: 10, border: `1px dashed ${theme.border}` }}>
          <p style={{ fontSize: 12, color: theme.textMuted, textAlign: "center" }}>
            <span style={{ color: T.blue600, fontWeight: 500 }}>Demo:</span> Any email + password works
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SIDEBAR
// ============================================================
const Sidebar = ({ activePage, onNavigate, user, theme, collapsed, onCollapse }) => {
  const navItems = [
    { id: "home", label: "Home", Icon: Icons.Home },
    { id: "dashboard", label: "Dashboard", Icon: Icons.Dashboard },
    { id: "chatbot", label: "AI Advisor", Icon: Icons.Chat },
    { id: "guide", label: "App Guide", Icon: Icons.Guide },
  ];

  return (
    <div style={{
      width: collapsed ? 68 : 240,
      minHeight: "100vh",
      background: theme.surface,
      borderRight: `1px solid ${theme.border}`,
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      position: "fixed", top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ flexShrink: 0 }}><Icons.Logo /></div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", whiteSpace: "nowrap" }}>FinAdvisor</p>
            <p style={{ fontSize: 10, color: theme.textMuted, whiteSpace: "nowrap" }}>AI-Powered Wealth</p>
          </div>
        )}
        <button onClick={onCollapse}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: 4, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {navItems.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onNavigate(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: active ? `${T.blue600}15` : "transparent",
                color: active ? T.blue600 : theme.textMuted,
                marginBottom: 2, transition: "all 0.15s",
                textAlign: "left",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = `${theme.border}`)}
              onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ flexShrink: 0, display: "flex" }}><Icon /></div>
              {!collapsed && <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>}
              {active && !collapsed && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: T.blue600 }} />}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div style={{ padding: 12, borderTop: `1px solid ${theme.border}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          borderRadius: 10, background: theme.surface2,
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.blue600}, ${T.teal})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
              <p style={{ fontSize: 11, color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HOME PAGE - Form 16 Upload
// ============================================================
const HomePage = ({ theme, onDataLoaded }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const fileRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== "application/pdf") { alert("Please upload a PDF file"); return; }
    setFile(f);
    setProcessing(true);
    // Simulate API call to POST /parse-form16
    await new Promise(r => setTimeout(r, 2200));
    const mockExtracted = {
      gross_salary: 1200000,
      tax_deducted: 145000,
      investments_80c: 150000,
      hra_exemption: 72000,
      net_taxable_income: 978000,
    };
    setExtractedData(mockExtracted);
    setProcessing(false);
    setProcessed(true);
    onDataLoaded?.(mockExtracted);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>
          Upload Form 16
        </h1>
        <p style={{ color: theme.textMuted, fontSize: 15 }}>AI-powered extraction of your tax & salary details for personalized advice</p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !file && fileRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? T.blue600 : processed ? T.green : theme.border}`,
          borderRadius: 20, padding: "48px 32px", textAlign: "center",
          background: dragging ? `${T.blue600}08` : processed ? `${T.green}08` : theme.surface,
          cursor: file ? "default" : "pointer",
          transition: "all 0.2s",
          marginBottom: 28,
        }}>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />

        {processing ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
            <p style={{ color: T.blue600, fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analyzing Form 16...</p>
            <p style={{ color: theme.textMuted, fontSize: 14 }}>AI is extracting your financial data</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue600, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        ) : processed ? (
          <div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ color: T.green, fontWeight: 600, fontSize: 16 }}>Data Extracted Successfully</p>
            <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>{file?.name}</p>
          </div>
        ) : (
          <div>
            <div style={{ color: theme.textMuted, marginBottom: 12, display: "flex", justifyContent: "center" }}><Icons.Upload /></div>
            <p style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your Form 16 PDF here</p>
            <p style={{ color: theme.textMuted, fontSize: 14 }}>or <span style={{ color: T.blue600 }}>click to browse</span> · PDF only, max 10MB</p>
          </div>
        )}
      </div>

      {/* Extracted Data Cards */}
      {processed && extractedData && (
        <div className="fade-in">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16 }}>Extracted Financial Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Gross Salary", value: extractedData.gross_salary, color: T.blue600 },
              { label: "Tax Deducted (TDS)", value: extractedData.tax_deducted, color: T.red },
              { label: "80C Investments", value: extractedData.investments_80c, color: T.green },
              { label: "HRA Exemption", value: extractedData.hra_exemption, color: T.purple },
              { label: "Net Taxable Income", value: extractedData.net_taxable_income, color: T.amber },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 12, padding: "16px 18px",
                borderLeft: `3px solid ${color}`,
              }}>
                <p style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>{fmtINR(value)}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "14px 18px", background: `${T.blue600}10`, borderRadius: 12, border: `1px solid ${T.blue600}30` }}>
            <p style={{ fontSize: 14, color: theme.text }}>
              ✨ <strong style={{ color: T.blue600 }}>Dashboard auto-populated</strong> — Visit the Dashboard tab to see your personalized financial insights.
            </p>
          </div>
        </div>
      )}

      {/* Info Cards */}
      {!processed && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { icon: "🔒", title: "Bank-Level Security", desc: "256-bit encryption, GDPR compliant" },
            { icon: "🤖", title: "AI-Powered Parsing", desc: "Gemini AI extracts data accurately" },
            { icon: "⚡", title: "Instant Analysis", desc: "Results in under 3 seconds" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{title}</p>
              <p style={{ fontSize: 13, color: theme.textMuted }}>{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// FINANCIAL DASHBOARD
// ============================================================
const Dashboard = ({ theme, formData }) => {
  const netWorth = 4250000;
  const monthlySavings = 38500;
  const taxSaved = 46500;
  const sipValue = 1487000;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
            {p.name}: {fmtINR(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const DonutLabel = ({ cx, cy, value }) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" style={{ fontSize: 18, fontWeight: 700, fill: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>
        {fmtINR(netWorth)}
      </tspan>
      <tspan x={cx} dy="22" style={{ fontSize: 11, fill: theme.textMuted }}>Net Worth</tspan>
    </text>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
            Financial Dashboard
          </h1>
          <p style={{ color: theme.textMuted, fontSize: 14 }}>FY 2024–25 Overview · Last updated today</p>
        </div>
        <ReportButton theme={theme} data={{ net_worth: netWorth, gross_salary: formData?.gross_salary || 1200000, tax_saved: taxSaved, monthly_savings: monthlySavings }} />
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Net Worth" value={fmtINR(netWorth)} sub="↑ 12.4% this year" icon={Icons.Wallet} color={T.blue600} theme={theme} />
        <MetricCard label="Monthly Savings" value={fmtINR(monthlySavings)} sub="38.5% savings rate" icon={Icons.Trend} color={T.green} theme={theme} />
        <MetricCard label="Tax Saved" value={fmtINR(taxSaved)} sub="80C + HRA benefits" icon={Icons.Shield} color={T.purple} theme={theme} />
        <MetricCard label="SIP Portfolio" value={fmtINR(sipValue)} sub="↑ 18.2% XIRR" icon={Icons.Dashboard} color={T.teal} theme={theme} />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, marginBottom: 16 }}>
        {/* Donut Chart */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 16 }}>Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={88}
                dataKey="value" paddingAngle={3}>
                {assetAllocationData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <DonutLabel cx={0} cy={0} value={netWorth} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {assetAllocationData.map(({ name, value, color }) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: theme.textMuted, flex: 1 }}>{name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth Growth */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Wealth Growth Projection</h3>
            <span style={{ fontSize: 12, color: theme.textMuted, background: theme.surface2, padding: "3px 10px", borderRadius: 20 }}>12-month</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={wealthGrowthData}>
              <defs>
                <linearGradient id="aggGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.blue600} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.blue600} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="modGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.teal} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={T.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: theme.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: theme.textMuted }} />
              <Area type="monotone" dataKey="aggressive" name="Aggressive" stroke={T.blue600} fill="url(#aggGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="moderate" name="Moderate" stroke={T.teal} fill="url(#modGrad)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conservative" name="Conservative" stroke={T.gray400} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Cash Flow */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "20px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 16 }}>Monthly Cash Flow (H2 2024)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: theme.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="income" name="Income" stroke={T.blue600} strokeWidth={2.5} dot={{ fill: T.blue600, r: 4 }} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke={T.red} strokeWidth={2} dot={{ fill: T.red, r: 3 }} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="savings" name="Savings" stroke={T.green} strokeWidth={2} dot={{ fill: T.green, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================================
// REPORT DOWNLOAD BUTTON
// ============================================================
const ReportButton = ({ theme, data }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    // In prod: POST to /generate-report then download
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    alert("✅ In production, this triggers POST /generate-report and downloads a PDF report via ReportLab.");
  };

  return (
    <button onClick={handleDownload} disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
        background: loading ? T.blue400 : T.blue600, border: "none", borderRadius: 10,
        color: "white", fontSize: 14, fontWeight: 500, cursor: loading ? "wait" : "pointer",
        transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = T.blue700)}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = T.blue600)}
    >
      <Icons.Download />
      {loading ? "Generating..." : "Download Report"}
    </button>
  );
};

// ============================================================
// AI CHATBOT
// ============================================================
const ChatBot = ({ theme, user }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your AI Financial Advisor powered by Gemini. I can help you with:\n\n• **Tax planning** — Section 80C, 80D, HRA optimization\n• **Investment advice** — SIP, mutual funds, NPS\n• **Wealth strategies** — portfolio rebalancing, goal planning\n• **Budget analysis** — cash flow, savings rate\n\nWhat's on your financial mind today?`,
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [messages]);

  const formatMsg = (text) => {
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      const bullet = bold.startsWith("•") ? `<span style="color:${T.blue600}">•</span>${bold.slice(1)}` : bold;
      return <p key={i} style={{ marginBottom: line ? 4 : 0 }} dangerouslySetInnerHTML={{ __html: bullet }} />;
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input, time: new Date() };
    setMessages(p => [...p, userMsg]);
    const q = input;
    setInput("");
    setLoading(true);

    // Call Anthropic API via the artifact API pattern
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an expert Indian financial advisor named FinBot. Provide concise, practical advice on Indian personal finance: income tax (IT Act), Section 80C/80D/24B deductions, mutual funds, SIP, NPS, ELSS, HRA, PPF, EPF, real estate, and general wealth management. Keep responses clear and actionable. Use ₹ for amounts. Format with bullet points where helpful.`,
          messages: [
            ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: q }
          ],
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "I couldn't get a response right now. Please try again.";
      setMessages(p => [...p, { role: "assistant", content: reply, time: new Date() }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection error. In production, this routes to your FastAPI `/chat` endpoint with Gemini. Please try again.", time: new Date() }]);
    }
    setLoading(false);
  };

  const quickPrompts = ["How can I save more tax?", "Best SIP funds for 2025?", "How to plan for retirement?", "Explain NPS benefits"];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>AI Financial Advisor</h1>
        <p style={{ color: theme.textMuted, fontSize: 14 }}>Powered by Claude AI · Expert in Indian personal finance</p>
      </div>

      {/* Chat Window */}
      <div style={{
        flex: 1, overflow: "auto", background: theme.surface,
        border: `1px solid ${theme.border}`, borderRadius: 16,
        padding: 20, display: "flex", flexDirection: "column", gap: 16,
        minHeight: 0,
      }}>
        {messages.map((msg, i) => (
          <div key={i} className="fade-in" style={{
            display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-start",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "assistant" ? `linear-gradient(135deg, ${T.blue600}, ${T.teal})` : `${T.blue600}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: msg.role === "assistant" ? "white" : T.blue600,
            }}>
              {msg.role === "assistant" ? <Icons.Bot /> : <Icons.User />}
            </div>
            <div style={{
              maxWidth: "75%",
              background: msg.role === "user" ? T.blue600 : theme.surface2,
              color: msg.role === "user" ? "white" : theme.text,
              borderRadius: msg.role === "user" ? "18px 6px 18px 18px" : "6px 18px 18px 18px",
              padding: "12px 16px",
              fontSize: 14, lineHeight: 1.6, border: msg.role === "assistant" ? `1px solid ${theme.border}` : "none",
            }}>
              {formatMsg(msg.content)}
              <p style={{ fontSize: 10, marginTop: 6, opacity: 0.6, textAlign: msg.role === "user" ? "right" : "left" }}>
                {msg.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.blue600}, ${T.teal})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Icons.Bot />
            </div>
            <div style={{ background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: "6px 18px 18px 18px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: T.blue600 }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Prompts */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0 8px", flexWrap: "wrap" }}>
        {quickPrompts.map(q => (
          <button key={q} onClick={() => { setInput(q); }}
            style={{
              padding: "6px 12px", background: theme.surface, border: `1px solid ${theme.border}`,
              borderRadius: 20, fontSize: 12, color: theme.textMuted, cursor: "pointer",
              transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${T.blue600}`; e.currentTarget.style.color = T.blue600; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${theme.border}`; e.currentTarget.style.color = theme.textMuted; }}
          >{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about tax planning, investments, SIP..."
          style={{
            flex: 1, padding: "13px 18px", borderRadius: 12,
            border: `1px solid ${theme.border}`, background: theme.surface,
            color: theme.text, fontSize: 14, outline: "none",
            fontFamily: "'DM Sans', sans-serif",
            transition: "border 0.2s",
          }}
          onFocus={e => e.target.style.border = `1px solid ${T.blue600}`}
          onBlur={e => e.target.style.border = `1px solid ${theme.border}`}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{
            width: 46, height: 46, borderRadius: 12, border: "none",
            background: input.trim() && !loading ? T.blue600 : theme.border,
            color: input.trim() && !loading ? "white" : theme.textMuted,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}>
          <Icons.Send />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// APP GUIDE PAGE
// ============================================================
const GuidePage = ({ theme }) => {
  const steps = [
    { num: "01", title: "Upload Form 16", desc: "Navigate to Home and upload your employer-issued Form 16 PDF. Our AI will extract your salary, TDS, and investment details automatically.", icon: "📄" },
    { num: "02", title: "Review Dashboard", desc: "Visit the Dashboard for a comprehensive view of your asset allocation, wealth growth projections, and key financial metrics.", icon: "📊" },
    { num: "03", title: "Chat with AI Advisor", desc: "Ask our AI advisor personalized questions about tax optimization, SIP strategies, and wealth management tailored to your profile.", icon: "🤖" },
    { num: "04", title: "Download Report", desc: "Click 'Download Report' on the Dashboard to generate a professional PDF financial advisory report for your records.", icon: "⬇️" },
  ];

  const stack = [
    { name: "React.js", role: "Frontend Framework", color: T.blue600 },
    { name: "Recharts", role: "Data Visualization", color: T.teal },
    { name: "FastAPI", role: "Python Backend", color: T.green },
    { name: "Gemini AI", role: "AI Chat Engine", color: T.purple },
    { name: "PyMuPDF", role: "PDF Parsing", color: T.amber },
    { name: "ReportLab", role: "Report Generation", color: T.red },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>App Guide</h1>
        <p style={{ color: theme.textMuted, fontSize: 15 }}>Get the most out of your AI Financial Advisor</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
        {steps.map(({ num, title, desc, icon }) => (
          <div key={num} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: `${T.blue600}15`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              fontSize: 22,
            }}>{icon}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.blue600, letterSpacing: "0.08em" }}>{num}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{title}</h3>
              </div>
              <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.6 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16 }}>Technical Stack</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {stack.map(({ name, role, color }) => (
          <div key={name} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${color}` }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 3 }}>{name}</p>
            <p style={{ fontSize: 12, color: theme.textMuted }}>{role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP - GATEKEEPER + LAYOUT
// ============================================================
export default function App() {
  const theme = useTheme();
  const [user, setUser] = useState(null);          // GATEKEEPER: null = not logged in
  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState(null);

  // GATEKEEPER: Redirect to auth if not logged in
  if (!user) {
    return (
      <>
        <GlobalStyles />
        <AuthScreen theme={theme} onLogin={setUser} />
      </>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  const pageComponents = {
    home: <HomePage theme={theme} onDataLoaded={(d) => { setFormData(d); }} />,
    dashboard: <Dashboard theme={theme} formData={formData} />,
    chatbot: <ChatBot theme={theme} user={user} />,
    guide: <GuidePage theme={theme} />,
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex" }}>
        {/* SIDEBAR */}
        <Sidebar
          activePage={page} onNavigate={setPage} user={user} theme={theme}
          collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(p => !p)}
        />

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, marginLeft: sidebarWidth, transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
          {/* Top Bar */}
          <div style={{
            position: "sticky", top: 0, zIndex: 50,
            background: `${theme.bg}CC`, backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${theme.border}`,
            padding: "14px 32px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", textTransform: "capitalize" }}>
                {page === "chatbot" ? "AI Advisor" : page === "guide" ? "App Guide" : page.charAt(0).toUpperCase() + page.slice(1)}
              </h2>
              <p style={{ fontSize: 12, color: theme.textMuted }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Dark Mode Toggle */}
              <button onClick={theme.toggle}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`,
                  background: theme.surface, cursor: "pointer", color: theme.textMuted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                {theme.dark ? <Icons.Sun /> : <Icons.Moon />}
              </button>

              {/* Logout */}
              <button onClick={() => setUser(null)}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: `1px solid ${theme.border}`,
                  background: theme.surface, color: theme.textMuted, cursor: "pointer",
                  fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.red; }}
                onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border; }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Page Content */}
          <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
            {pageComponents[page]}
          </div>
        </div>
      </div>
    </>
  );
}
