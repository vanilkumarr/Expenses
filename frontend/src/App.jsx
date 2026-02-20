import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const API = "https://expenses-h7a2.onrender.com";

const CATEGORIES = ["Food", "Bills", "Snacks", "Transport", "Shopping", "Other"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const PALETTE = {
  bg: "#0a0a0f", card: "#12121a", border: "#1e1e2e",
  accent: "#f0c060", accent2: "#e05050", accent3: "#50c0a0", accent4: "#8060f0",
  text: "#e8e8f0", muted: "#666688",
};

const CAT_COLORS = {
  Food: "#f0c060", Bills: "#e05050", Snacks: "#50c0a0",
  Transport: "#8060f0", Shopping: "#f06090", Other: "#60a0f0",
};

const formatINR = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const glassCard = { background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "16px", padding: "24px" };

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState({ description: "", amount: "", category: "Food", month: MONTHS[new Date().getMonth()], date: new Date().toISOString().split("T")[0] });
  const [filterMonth, setFilterMonth] = useState("All");
  const [toast, setToast] = useState(null);

  // Fetch all expenses from backend
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API}/api/expenses`);
      const data = await res.json();
      if (data.success) setExpenses(data.data);
    } catch (err) {
      showToast("Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Add expense — POST to backend
  const addExpense = async () => {
    if (!form.description || !form.amount) return showToast("Fill in description and amount");
    try {
      const res = await fetch(`${API}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setExpenses((prev) => [data.data, ...prev]);
        setForm({ description: "", amount: "", category: "Food", month: MONTHS[new Date().getMonth()], date: new Date().toISOString().split("T")[0] });
        showToast("Expense added ✓");
        setActiveTab("dashboard");
      } else {
        showToast(data.error || "Failed to add");
      }
    } catch {
      showToast("Could not connect to backend");
    }
  };

  // Delete expense — DELETE to backend
  const deleteExpense = async (id) => {
    try {
      const res = await fetch(`${API}/api/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      showToast("Could not delete");
    }
  };

  const filtered = useMemo(() =>
    filterMonth === "All" ? expenses : expenses.filter((e) => e.month === filterMonth),
    [expenses, filterMonth]
  );

  const totalSpend = useMemo(() => filtered.reduce((a, b) => a + b.amount, 0), [filtered]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byMonth = useMemo(() => {
    const map = {};
    expenses.forEach((e) => { map[e.month] = (map[e.month] || 0) + e.amount; });
    return MONTHS.filter((m) => map[m]).map((m) => ({ month: m.slice(0, 3), amount: map[m] }));
  }, [expenses]);

  const topCategory = [...byCategory].sort((a, b) => b.value - a.value)[0];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", color: PALETTE.accent, fontFamily: "monospace", fontSize: "18px" }}>
      Loading your expenses...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, color: PALETTE.text, fontFamily: "'DM Mono', 'Courier New', monospace", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0a0f; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        input, select { outline: none; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 20px; border-radius: 8px; font-family: inherit; font-size: 13px; transition: all 0.2s; }
        .tab-btn.active { background: ${PALETTE.accent}22; color: ${PALETTE.accent}; border: 1px solid ${PALETTE.accent}44; }
        .tab-btn:not(.active) { color: ${PALETTE.muted}; }
        .tab-btn:not(.active):hover { color: ${PALETTE.text}; }
        .del-btn { background: none; border: none; cursor: pointer; color: ${PALETTE.muted}; font-size: 16px; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; }
        .del-btn:hover { color: ${PALETTE.accent2}; background: ${PALETTE.accent2}11; }
        .add-btn { background: ${PALETTE.accent}; color: #0a0a0f; border: none; cursor: pointer; padding: 12px 28px; border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 500; transition: all 0.2s; width: 100%; margin-top: 8px; }
        .add-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .expense-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 10px; margin-bottom: 8px; background: #16161f; border: 1px solid ${PALETTE.border}; transition: all 0.2s; }
        .expense-row:hover { border-color: #2e2e44; }
        .cat-pill { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
        .stat-card { background: ${PALETTE.card}; border: 1px solid ${PALETTE.border}; border-radius: 16px; padding: 20px 24px; }
        .toast { position: fixed; bottom: 32px; right: 32px; background: ${PALETTE.accent}; color: #0a0a0f; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 999; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .section-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: ${PALETTE.muted}; margin-bottom: 20px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media(max-width: 700px) { .grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${PALETTE.border}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            PAISA <span style={{ color: PALETTE.accent }}>TRACKER</span>
          </div>
          <div style={{ fontSize: "11px", color: PALETTE.muted, marginTop: "2px", letterSpacing: "2px" }}>PERSONAL EXPENSE DASHBOARD · 2026</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["dashboard", "add", "history"].map((t) => (
            <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
              {t === "dashboard" ? "📊 Dashboard" : t === "add" ? "➕ Add" : "📋 History"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <span style={{ fontSize: "12px", color: PALETTE.muted, letterSpacing: "1px" }}>FILTER</span>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.text, padding: "8px 14px", borderRadius: "8px", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}>
                <option>All</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "Total Spent", value: formatINR(totalSpend), color: PALETTE.accent },
                { label: "Transactions", value: filtered.length, color: PALETTE.accent3 },
                { label: "Top Category", value: topCategory?.name || "—", color: PALETTE.accent4 },
                { label: "Avg per Entry", value: filtered.length ? formatINR(Math.round(totalSpend / filtered.length)) : "—", color: PALETTE.accent2 },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div style={{ fontSize: "11px", color: PALETTE.muted, letterSpacing: "2px", marginBottom: "10px" }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid2">
              <div style={glassCard}>
                <div className="section-title">Spending by Category</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {byCategory.map((entry) => <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#888"} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "8px", fontFamily: "inherit", fontSize: "12px" }} />
                    <Legend formatter={(v) => <span style={{ fontSize: "12px", color: PALETTE.text }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={glassCard}>
                <div className="section-title">Monthly Comparison</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byMonth} barSize={32}>
                    <XAxis dataKey="month" tick={{ fill: PALETTE.muted, fontSize: 12, fontFamily: "inherit" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: PALETTE.muted, fontSize: 11, fontFamily: "inherit" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "8px", fontFamily: "inherit", fontSize: "12px" }} cursor={{ fill: "#ffffff08" }} />
                    <Bar dataKey="amount" fill={PALETTE.accent} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ ...glassCard, marginTop: "24px" }}>
              <div className="section-title">Recent Transactions</div>
              {filtered.slice(0, 5).map((e) => (
                <div key={e.id} className="expense-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="cat-pill" style={{ background: CAT_COLORS[e.category] + "22", color: CAT_COLORS[e.category] }}>{e.category}</span>
                    <span style={{ fontSize: "14px" }}>{e.description}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ color: PALETTE.muted, fontSize: "12px" }}>{e.month}</span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: PALETTE.accent }}>{formatINR(e.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD TAB */}
        {activeTab === "add" && (
          <div style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div style={glassCard}>
              <div className="section-title">New Expense</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Description", key: "description", type: "text", placeholder: "e.g. Samosa, Jio Bill..." },
                  { label: "Amount (₹)", key: "amount", type: "number", placeholder: "0" },
                ].map((f) => (
                  <div key={f.key}>
                    <div style={{ fontSize: "11px", color: PALETTE.muted, letterSpacing: "2px", marginBottom: "8px" }}>{f.label.toUpperCase()}</div>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", background: "#16161f", border: `1px solid ${PALETTE.border}`, color: PALETTE.text, padding: "12px 16px", borderRadius: "10px", fontFamily: "inherit", fontSize: "14px" }} />
                  </div>
                ))}
                {[
                  { label: "Category", key: "category", options: CATEGORIES },
                  { label: "Month", key: "month", options: MONTHS },
                ].map((f) => (
                  <div key={f.key}>
                    <div style={{ fontSize: "11px", color: PALETTE.muted, letterSpacing: "2px", marginBottom: "8px" }}>{f.label.toUpperCase()}</div>
                    <select value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", background: "#16161f", border: `1px solid ${PALETTE.border}`, color: PALETTE.text, padding: "12px 16px", borderRadius: "10px", fontFamily: "inherit", fontSize: "14px", cursor: "pointer" }}>
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button className="add-btn" onClick={addExpense}>Add Expense</button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", color: PALETTE.muted, letterSpacing: "1px" }}>FILTER</span>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.text, padding: "8px 14px", borderRadius: "8px", fontFamily: "inherit", fontSize: "13px", cursor: "pointer" }}>
                <option>All</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: PALETTE.muted }}>{filtered.length} entries · {formatINR(totalSpend)}</span>
            </div>
            <div style={glassCard}>
              {filtered.length === 0 && <div style={{ color: PALETTE.muted, textAlign: "center", padding: "40px" }}>No expenses found</div>}
              {filtered.map((e) => (
                <div key={e.id} className="expense-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <span className="cat-pill" style={{ background: CAT_COLORS[e.category] + "22", color: CAT_COLORS[e.category], minWidth: "60px", textAlign: "center" }}>{e.category}</span>
                    <div>
                      <div style={{ fontSize: "14px" }}>{e.description}</div>
                      <div style={{ fontSize: "11px", color: PALETTE.muted, marginTop: "2px" }}>{e.month}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: PALETTE.accent, fontSize: "16px" }}>{formatINR(e.amount)}</span>
                    <button className="del-btn" onClick={() => deleteExpense(e.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
