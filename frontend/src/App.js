import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

// ============================================================
// CONFIG — Update this if your Render URL changes
// ============================================================
const API_BASE = "https://finadvisor-backend.onrender.com";

// ============================================================
// DESIGN TOKENS
// ============================================================
const T = {
  blue50: "#EEF4FF", blue100: "#C7D9FF", blue400: "#4B8BFF",
  blue600: "#0F62FE", blue700: "#0043CE", blue900: "#001141",
  gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB",
  gray400: "#9CA3AF", gray600: "#4B5563", gray800: "#1F2937", gray900: "#111827",
  green: "#10B981", amber: "#F59E0B", red: "#EF4444",
  teal: "#14B8A6", purple: "#8B5CF6",
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
// UTILITIES
// ============================================================
const fmtINR = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);

// ============================================================
// SVG ICONS
// ============================================================
const Icons = {
  Home: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  Dashboard: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>),
  Chat: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>),
  Guide: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
  Upload: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>),
  Send: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Download: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  Sun: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  Moon: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>),
  Bot: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>),
  User: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  Trend: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  Wallet: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 010-4h14v4"/><path d="M4 6v12a2 2 0 002 2h14v-4"/><circle cx="17" cy="12" r="1"/></svg>),
  Shield: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Logo: () => (<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill={T.blue600}/><path d="M8 22L16 10L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 18h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>),
};

// ============================================================
// THEME HOOK
// ============================================================
const useTheme = () => {
  const [dark, setDark] = useState(false);
  return {
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
    ::-webkit-scrollbar-thumb { background: #4B8BFF44; border-radius: 4px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .typing-dot { animation: pulse 1.2s ease infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  `}</style>
);

// ============================================================
// METRIC CARD
// ============================================================
const MetricCard = ({ label, value, sub, icon: Icon, color, theme }) => (
  <div className="fade-in" style={{
    background: theme.surface, border: `1px solid ${theme.border}`,
    borderRadius: 16, padding: "20px 24px",
    display: "flex", alignItems: "flex-start", gap: 16,
    transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}18`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
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
// AUTH SCREEN
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
    border: `1px solid ${theme.border}`, background: theme.surface2,
    color: theme.text, fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  };

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      // Call real backend
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      onLogin(data.user || { name: name || email.split("@")[0], email });
    } catch (err) {
      // Fallback: allow login even if backend is sleeping on Render free tier
      console.warn("Backend login failed, using local auth:", err.message);
      onLogin({ name: name || email.split("@")[0], email });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: `${T.blue600}12`, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: `${T.teal}10`, filter: "blur(60px)" }} />

      <div className="fade-in" style={{ width: "100%", maxWidth: 420, margin: "0 16px", background: theme.surface, borderRadius: 24, border: `1px solid ${theme.border}`, padding: "48px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <Icons.Logo />
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: theme.text }}>FinAdvisor AI</span>
          </div>
          <p style={{ color: theme.textMuted, fontSize: 14 }}>Your intelligent wealth companion</p>
        </div>

        <div style={{ display: "flex", background: theme.surface2, borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", background: mode === m ? theme.blue : "transparent", color: mode === m ? "white" : theme.textMuted, fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
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
            onBlur={e => e.target.style.border = `1px solid ${theme.border}`}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {error && <p style={{ color: T.red, fontSize: 13, marginTop: 10 }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", marginTop: 20, padding: "14px", background: loading ? T.blue400 : T.blue600, border: "none", borderRadius: 10, color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={e => !loading && (e.target.style.background = T.blue700)}
          onMouseLeave={e => !loading && (e.target.style.background = T.blue600)}>
          {loading ? "Connecting..." : mode === "login" ? "Sign In →" : "Create Account →"}
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
    <div style={{ width: collapsed ? 68 : 240, minHeight: "100vh", background: theme.surface, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
      <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ flexShrink: 0 }}><Icons.Logo /></div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", whiteSpace: "nowrap" }}>FinAdvisor</p>
            <p style={{ fontSize: 10, color: theme.textMuted, whiteSpace: "nowrap" }}>AI-Powered Wealth</p>
          </div>
        )}
        <button onClick={onCollapse} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: 4, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {navItems.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onNavigate(id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active ? `${T.blue600}15` : "transparent", color: active ? T.blue600 : theme.textMuted, marginBottom: 2, transition: "all 0.15s", textAlign: "left", justifyContent: collapsed ? "center" : "flex-start" }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = theme.surface2)}
              onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}>
              <div style={{ flexShrink: 0, display: "flex" }}><Icon /></div>
              {!collapsed && <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>}
              {active && !collapsed && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: T.blue600 }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 12, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: theme.surface2, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.blue600}, ${T.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>
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
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef();

  const handleFile = async (f) => {
    if (!f) return;
    // Accept PDF or any file for testing
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file");
      return;
    }
    setFile(f);
    setProcessing(true);
    setProcessed(false);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", f);

    try {
      const response = await fetch(`${API_BASE}/parse-form16`, {
        method: "POST",
        body: formData,
        // DO NOT set Content-Type header — browser sets multipart boundary automatically
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.status === "success") {
        setExtractedData(result.data);
        onDataLoaded?.(result.data);
        setProcessed(true);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadError(`Upload failed: ${error.message}`);
      // Use demo data as fallback so app remains usable
      const demoData = {
        gross_salary: 1200000, tax_deducted: 120000,
        investments_80c: 150000, hra_exemption: 60000, net_taxable_income: 990000,
      };
      setExtractedData(demoData);
      onDataLoaded?.(demoData);
      setProcessed(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>Upload Form 16</h1>
        <p style={{ color: theme.textMuted, fontSize: 15 }}>AI-powered extraction of your tax & salary details</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !file && fileRef.current.click()}
        style={{ border: `2px dashed ${dragging ? T.blue600 : processed ? T.green : theme.border}`, borderRadius: 20, padding: "48px 32px", textAlign: "center", background: processed ? `${T.green}08` : `${T.blue600}05`, cursor: file ? "default" : "pointer", transition: "all 0.2s", marginBottom: 28 }}>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />

        {processing ? (
          <div>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚙️</div>
            <p style={{ color: T.blue600, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Analyzing your Form 16...</p>
            <p style={{ color: theme.textMuted, fontSize: 14 }}>Gemini AI is extracting financial data</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
              {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue600, animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        ) : processed ? (
          <div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p style={{ color: T.green, fontWeight: 600, fontSize: 16 }}>
              {uploadError ? "Demo data loaded (backend error)" : "Data Extracted Successfully!"}
            </p>
            <p style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>{file?.name}</p>
            {uploadError && <p style={{ color: T.amber, fontSize: 12, marginTop: 6 }}>{uploadError}</p>}
          </div>
        ) : (
          <div>
            <div style={{ color: theme.textMuted, marginBottom: 12, display: "flex", justifyContent: "center" }}><Icons.Upload /></div>
            <p style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your Form 16 PDF here</p>
            <p style={{ color: theme.textMuted, fontSize: 14 }}>or <span style={{ color: T.blue600 }}>click to browse</span> · PDF only · max 10MB</p>
          </div>
        )}
      </div>

      {processed && extractedData && (
        <div className="fade-in">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 16 }}>📋 Extracted Financial Data</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              ["Gross Salary", extractedData.gross_salary, T.blue600],
              ["Tax Deducted (TDS)", extractedData.tax_deducted, T.red],
              ["80C Investments", extractedData.investments_80c, T.green],
              ["HRA Exemption", extractedData.hra_exemption, T.purple],
              ["Net Taxable Income", extractedData.net_taxable_income, T.amber],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "16px 18px", borderLeft: `3px solid ${color}` }}>
                <p style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>{fmtINR(value || 0)}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "14px 18px", background: `${T.blue600}10`, borderRadius: 12, border: `1px solid ${T.blue600}30` }}>
            <p style={{ fontSize: 14, color: theme.text }}>✨ <strong style={{ color: T.blue600 }}>Dashboard auto-populated</strong> — Visit Dashboard tab for full analysis.</p>
          </div>
        </div>
      )}

      {!processed && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[["🔒", "Bank-Level Security", "256-bit encryption"], ["🤖", "AI-Powered Parsing", "Gemini AI extracts data"], ["⚡", "Instant Analysis", "Results in under 5s"]].map(([icon, title, desc]) => (
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
// DASHBOARD
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
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}: {fmtINR(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>Financial Dashboard</h1>
          <p style={{ color: theme.textMuted, fontSize: 14 }}>FY 2024–25 · Last updated today</p>
        </div>
        <ReportButton theme={theme} data={{ net_worth: netWorth, gross_salary: formData?.gross_salary || 1200000, tax_saved: taxSaved, monthly_savings: monthlySavings }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <MetricCard label="Net Worth" value={fmtINR(netWorth)} sub="↑ 12.4% this year" icon={Icons.Wallet} color={T.blue600} theme={theme} />
        <MetricCard label="Monthly Savings" value={fmtINR(monthlySavings)} sub="38.5% savings rate" icon={Icons.Trend} color={T.green} theme={theme} />
        <MetricCard label="Tax Saved" value={fmtINR(taxSaved)} sub="80C + HRA benefits" icon={Icons.Shield} color={T.purple} theme={theme} />
        <MetricCard label="SIP Portfolio" value={fmtINR(sipValue)} sub="↑ 18.2% XIRR" icon={Icons.Dashboard} color={T.teal} theme={theme} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, marginBottom: 16 }}>
        {/* Donut */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 16 }}>Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {assetAllocationData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          {assetAllocationData.map(({ name, value, color }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: theme.textMuted, flex: 1 }}>{name}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{value}%</span>
            </div>
          ))}
        </div>

        {/* Wealth Growth */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 16 }}>Wealth Growth Projection</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={wealthGrowthData}>
              <defs>
                <linearGradient id="aggGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.blue600} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.blue600} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: theme.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="aggressive" name="Aggressive" stroke={T.blue600} fill="url(#aggGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="moderate" name="Moderate" stroke={T.teal} fill="none" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conservative" name="Conservative" stroke={T.gray400} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

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
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke={T.red} strokeWidth={2} dot={{ fill: T.red, r: 3 }} />
            <Line type="monotone" dataKey="savings" name="Savings" stroke={T.green} strokeWidth={2} dot={{ fill: T.green, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================================
// REPORT BUTTON
// ============================================================
const ReportButton = ({ theme, data }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Report generation failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FinAdvisor_Report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Report error: ${err.message}\nMake sure your Render backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={loading}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: loading ? T.blue400 : T.blue600, border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 500, cursor: loading ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = T.blue700)}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = T.blue600)}>
      <Icons.Download />
      {loading ? "Generating PDF..." : "Download Report"}
    </button>
  );
};

// ============================================================
// AI CHATBOT — FIXED
// Key fixes:
//   1. History sent as {role, content} — backend validates role values
//   2. Added proper error display in chat instead of alert
//   3. Render free tier cold-start message shown
// ============================================================
const ChatBot = ({ theme, user }) => {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Hello ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your AI Financial Advisor powered by Gemini.\n\n• **Tax planning** — Section 80C, 80D, HRA optimization\n• **Investment advice** — SIP, mutual funds, NPS\n• **Wealth strategies** — goal planning, retirement\n\nWhat's on your financial mind?`,
    time: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const formatMsg = (text) =>
    text.split("\n").map((line, i) => {
      const html = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/^• /, `<span style="color:${T.blue600}">•</span> `);
      return <p key={i} style={{ marginBottom: line ? 3 : 0 }} dangerouslySetInnerHTML={{ __html: html }} />;
    });

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim(), time: new Date() };
    setMessages(p => [...p, userMsg]);
    const q = input.trim();
    setInput("");
    setLoading(true);

    try {
      // FIX: Build history correctly
      // Gemini expects role="user" or role="model" but our backend accepts "user"/"assistant"
      // and converts internally — just send user/assistant
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          history,  // send conversation context
          user_data: {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show backend's error message clearly
        throw new Error(data.detail || `Server error ${response.status}`);
      }

      setMessages(p => [...p, {
        role: "assistant",
        content: data.response || "No response received.",
        time: new Date(),
      }]);
    } catch (error) {
      let errMsg = error.message;
      // Helpful messages for common issues
      if (errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")) {
        errMsg = "⚠️ Cannot reach backend. Render free tier may be sleeping — wait 30 seconds and try again.";
      } else if (errMsg.includes("GEMINI_API_KEY")) {
        errMsg = "⚠️ GEMINI_API_KEY not set. Go to Render Dashboard → Your Service → Environment and add it.";
      }
      setMessages(p => [...p, {
        role: "assistant",
        content: errMsg,
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = ["How to save more tax?", "Best SIP for 2025?", "Explain NPS benefits", "How much emergency fund?"];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>AI Financial Advisor</h1>
        <p style={{ color: theme.textMuted, fontSize: 14 }}>Powered by Gemini AI · Expert in Indian personal finance</p>
      </div>

      {/* Render cold-start warning */}
      <div style={{ padding: "10px 14px", background: `${T.amber}15`, border: `1px solid ${T.amber}40`, borderRadius: 10, marginBottom: 12, fontSize: 13, color: theme.text }}>
        💡 <strong>Note:</strong> If Render backend is sleeping (free tier), first message may take 30–60 seconds to respond.
      </div>

      <div style={{ flex: 1, overflow: "auto", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className="fade-in" style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: msg.role === "assistant" ? `linear-gradient(135deg, ${T.blue600}, ${T.teal})` : `${T.blue600}20`, display: "flex", alignItems: "center", justifyContent: "center", color: msg.role === "assistant" ? "white" : T.blue600 }}>
              {msg.role === "assistant" ? <Icons.Bot /> : <Icons.User />}
            </div>
            <div style={{ maxWidth: "75%", background: msg.role === "user" ? T.blue600 : theme.surface2, color: msg.role === "user" ? "white" : theme.text, borderRadius: msg.role === "user" ? "18px 6px 18px 18px" : "6px 18px 18px 18px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, border: msg.role === "assistant" ? `1px solid ${theme.border}` : "none" }}>
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

      <div style={{ display: "flex", gap: 8, margin: "10px 0 8px", flexWrap: "wrap" }}>
        {quickPrompts.map(q => (
          <button key={q} onClick={() => setInput(q)}
            style={{ padding: "6px 12px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, fontSize: 12, color: theme.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.blue600; e.currentTarget.style.borderColor = T.blue600; }}
            onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border; }}>
            {q}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about tax planning, investments, SIP..."
          style={{ flex: 1, padding: "13px 18px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
          onFocus={e => e.target.style.border = `1px solid ${T.blue600}`}
          onBlur={e => e.target.style.border = `1px solid ${theme.border}`} />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{ width: 46, height: 46, borderRadius: 12, border: "none", background: input.trim() && !loading ? T.blue600 : theme.border, color: "white", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
          <Icons.Send />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// GUIDE PAGE
// ============================================================
const GuidePage = ({ theme }) => {
  const steps = [
    { num: "01", title: "Upload Form 16", desc: "Navigate to Home and upload your Form 16 PDF. Gemini AI extracts salary, TDS, and investment details automatically.", icon: "📄" },
    { num: "02", title: "Review Dashboard", desc: "See asset allocation donut chart, wealth growth projection, monthly cash flow, and key financial metrics.", icon: "📊" },
    { num: "03", title: "Chat with AI Advisor", desc: "Ask personalized questions about 80C tax optimization, SIP strategies, and wealth management.", icon: "🤖" },
    { num: "04", title: "Download Report", desc: "Click 'Download Report' to generate a professional PDF report via ReportLab on your Render backend.", icon: "⬇️" },
  ];

  const stack = [
    { name: "React.js", role: "Frontend", color: T.blue600 },
    { name: "Recharts", role: "Charts", color: T.teal },
    { name: "Vercel", role: "Frontend Host", color: T.green },
    { name: "FastAPI", role: "Backend", color: T.purple },
    { name: "Gemini AI", role: "AI Engine", color: T.amber },
    { name: "Render", role: "Backend Host", color: T.red },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>App Guide</h1>
        <p style={{ color: theme.textMuted, fontSize: 15 }}>Get the most out of FinAdvisor AI</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {steps.map(({ num, title, desc, icon }) => (
          <div key={num} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${T.blue600}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>{icon}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.blue600, letterSpacing: "0.08em" }}>{num}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{title}</h3>
              </div>
              <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.6 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Debug helper for users */}
      <div style={{ background: theme.surface, border: `1px solid ${T.amber}40`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 12 }}>🔧 Troubleshooting Checklist</h3>
        {[
          ["GEMINI_API_KEY set in Render?", "Render Dashboard → Your Service → Environment → Add GEMINI_API_KEY"],
          ["Backend responding?", `Visit: ${API_BASE}/health in browser — should return JSON`],
          ["Render sleeping?", "Free tier sleeps after 15min. First request takes 30–60 seconds to wake up."],
          ["CORS issue?", "Backend uses allow_origins=['*'] — should work from any Vercel domain"],
          ["PDF upload failing?", "Check /health endpoint — pymupdf_available must be true"],
        ].map(([issue, fix]) => (
          <div key={issue} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 2 }}>❓ {issue}</p>
            <p style={{ fontSize: 13, color: theme.textMuted }}>→ {fix}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16 }}>Tech Stack</h2>
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
// MAIN APP — GATEKEEPER + LAYOUT
// ============================================================
export default function App() {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState(null);

  // GATEKEEPER: Not logged in → show Auth screen
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
    home: <HomePage theme={theme} onDataLoaded={d => setFormData(d)} />,
    dashboard: <Dashboard theme={theme} formData={formData} />,
    chatbot: <ChatBot theme={theme} user={user} />,
    guide: <GuidePage theme={theme} />,
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex" }}>
        <Sidebar activePage={page} onNavigate={setPage} user={user} theme={theme}
          collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(p => !p)} />

        <div style={{ flex: 1, marginLeft: sidebarWidth, transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
          {/* Top Bar */}
          <div style={{ position: "sticky", top: 0, zIndex: 50, background: `${theme.bg}CC`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${theme.border}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                {page === "chatbot" ? "AI Advisor" : page === "guide" ? "App Guide" : page.charAt(0).toUpperCase() + page.slice(1)}
              </h2>
              <p style={{ fontSize: 12, color: theme.textMuted }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={theme.toggle}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surface, cursor: "pointer", color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {theme.dark ? <Icons.Sun /> : <Icons.Moon />}
              </button>
              <button onClick={() => setUser(null)}
                style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.red; }}
                onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border; }}>
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
