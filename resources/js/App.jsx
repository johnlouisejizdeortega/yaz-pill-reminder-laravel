import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function getDayNum(startDate) {
  const s = new Date(startDate + "T00:00:00");
  const n = new Date(); n.setHours(0,0,0,0); s.setHours(0,0,0,0);
  return Math.floor((n - s) / 86400000) + 1;
}
function getTotalDays(start, end) {
  return Math.floor((new Date(end + "T00:00:00") - new Date(start + "T00:00:00")) / 86400000) + 1;
}
function load() { try { return JSON.parse(localStorage.getItem("yazv4")) || {}; } catch { return {}; } }
function save(o) { localStorage.setItem("yazv4", JSON.stringify(o)); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

const slide = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -16, scale: 0.98 },
};
const spring = { type: "spring", stiffness: 320, damping: 30 };

function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      <Label className="mb-1.5 block text-[10px] font-semibold text-black/40 uppercase tracking-widest">{label}</Label>
      {children}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-[#FF3B30] mt-1 font-medium">{error}</motion.p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-black/5 last:border-0">
      <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-semibold text-black/75">{value}</span>
    </div>
  );
}

function PillCell({ d, dayNum, taken }) {
  const placebo = d >= 25;
  const t = taken[d];
  const isToday = d === dayNum && t === undefined;

  let cls = "w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-full cursor-default select-none transition-all";
  if (t === true)        cls += " bg-[#007AFF] text-white shadow-sm";
  else if (t === false)  cls += " bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30";
  else if (isToday)      cls += " bg-white/80 text-[#007AFF] border-2 border-[#007AFF] pulse-ring";
  else if (placebo)      cls += " bg-[#FF9500]/10 text-[#FF9500]";
  else                   cls += " bg-black/5 text-black/30";

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22, delay: d * 0.01 }}
      whileHover={{ scale: 1.12 }}
      className={cls}
    >
      {t === true ? "✓" : t === false ? "✗" : d}
    </motion.div>
  );
}

export default function App() {
  const saved = load();
  const [page, setPage]   = useState(() => saved.email ? "dash" : "s1");
  const [cfg, setCfg]     = useState(saved);
  const [taken, setTaken] = useState(saved.taken || {});
  const [now, setNow]     = useState(new Date());
  const [alarm, setAlarm] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [errs, setErrs]   = useState({});
  const [f, setF] = useState({
    name:      saved.name      || "",
    startDate: saved.startDate || "",
    endDate:   saved.endDate   || "",
    email:     saved.email     || "",
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!cfg.email) return;
    const hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds();
    if (hh === 20 && mm === 30 && ss === 0) setAlarm(true);
  }, [now, cfg]);

  useEffect(() => {
    if (!cfg.email) return;
    fetch(`/api/status/${encodeURIComponent(cfg.email)}`)
      .then(r => {
        if (r.status === 404) return "not_found";
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (data === "not_found") {
          setPage("s1");
          return;
        }
        if (!data) return;
        const dayMap = {};
        const tot = getTotalDays(cfg.startDate, cfg.endDate);
        Object.entries(data.logs).forEach(([date, takenVal]) => {
          const s = new Date(cfg.startDate + "T00:00:00");
          const d = new Date(date + "T00:00:00");
          const dayNum = Math.floor((d - s) / 86400000) + 1;
          if (dayNum >= 1 && dayNum <= tot) dayMap[dayNum] = takenVal;
        });
        setTaken(dayMap);
        save({ ...cfg, taken: dayMap });
      })
      .catch(() => {});
  }, []);

  function validate() {
    const e = {};
    if (!f.name.trim())  e.name = "Required";
    if (!f.startDate)    e.startDate = "Required";
    if (!f.endDate)      e.endDate = "Required";
    if (f.startDate && f.endDate && new Date(f.endDate) < new Date(f.startDate)) e.endDate = "End must be after start";
    if (!f.email || !/\S+@\S+\.\S+/.test(f.email)) e.email = "Valid email required";
    setErrs(e);
    return !Object.keys(e).length;
  }

  async function activate() {
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: f.name, email: f.email, start_date: f.startDate, end_date: f.endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      const nc = { name: f.name, email: f.email, startDate: f.startDate, endDate: f.endDate, taken: {} };
      setCfg(nc); setTaken({}); save(nc);
      toast.success("Reminders activated! Check your email 💊");
      setPage("dash");
    } catch (e) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function answer(yes) {
    const dn = getDayNum(cfg.startDate);
    setAlarm(false);
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email: cfg.email, log_date: todayStr(), taken: yes }),
      });
      setTaken(t => {
        const updated = { ...t, [dn]: yes };
        save({ ...cfg, taken: updated });
        return updated;
      });
      toast(yes ? "✓ Logged as taken" : "✗ Logged as missed");
    } catch {
      toast.error("Failed to log. Try again.");
    }
  }

  async function reset() {
    await fetch(`/api/reset/${encodeURIComponent(cfg.email)}`, { method: "DELETE" }).catch(() => {});
    localStorage.removeItem("yazv4");
    setCfg({}); setTaken({}); setAlarm(false); setErrs({});
    setF({ name: "", startDate: "", endDate: "", email: "" });
    setPage("s1");
  }

  const fld = (k) => ({ value: f[k], onChange: e => setF(x => ({ ...x, [k]: e.target.value })) });

  const dn       = cfg.startDate ? getDayNum(cfg.startDate) : 0;
  const tot      = cfg.startDate && cfg.endDate ? getTotalDays(cfg.startDate, cfg.endDate) : 28;
  const pct      = tot > 1 ? Math.min(100, Math.max(0, ((dn - 1) / (tot - 1)) * 100)) : 0;
  const timeStr  = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const todayTaken = taken[dn];

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">

      {/* 75% viewport glass panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="glass rounded-3xl flex flex-col overflow-hidden"
        style={{ width: "75vw", height: "75vh", minWidth: 300 }}
      >

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.3)" }}>
          <motion.span
            animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
            transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
            className="text-3xl leading-none"
          >💊</motion.span>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-black/85 leading-tight">Pill Alarm</h1>
            <p className="text-[11px] text-black/40 font-medium">Yaz · 8:30 PM Daily</p>
          </div>

          {cfg.email && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="ml-auto glass-inner rounded-2xl px-4 py-2"
            >
              <span className="text-sm font-bold tabular-nums text-black/75 tracking-wide">{timeStr}</span>
            </motion.div>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">

            {/* ── Setup page ── */}
            {page === "s1" && (
              <motion.div key="s1" variants={slide} initial="initial" animate="animate" exit="exit"
                transition={spring} className="p-6">

                <p className="text-[10px] font-semibold uppercase tracking-widest text-black/35 mb-1">Setup</p>
                <h2 className="text-xl font-bold tracking-tight text-black/85 mb-5">Schedule & Email</h2>

                <Field label="Your Name" error={errs.name}>
                  <Input type="text" placeholder="Louise" {...fld("name")} />
                </Field>
                <Field label="Pill Start Date" error={errs.startDate}>
                  <Input type="date" {...fld("startDate")} />
                </Field>
                <Field label="Pill End Date" error={errs.endDate}>
                  <Input type="date" {...fld("endDate")} />
                </Field>
                <Field label="Reminder Email" error={errs.email}>
                  <Input type="email" placeholder="you@gmail.com" {...fld("email")} />
                </Field>

                <p className="text-[11px] text-black/35 mb-5 leading-relaxed font-medium">
                  Reminders sent at 8:00, 8:10, 8:20 &amp; 8:30 PM daily — even when this tab is closed.
                </p>

                <button className="ios-btn-primary w-full h-11" onClick={activate} disabled={busy}>
                  {busy ? "Activating…" : "Activate Reminder"}
                </button>
              </motion.div>
            )}

            {/* ── Dashboard ── */}
            {page === "dash" && (
              <motion.div key="dash" variants={slide} initial="initial" animate="animate" exit="exit"
                transition={spring}>

                {/* Alarm overlay */}
                <AnimatePresence>
                  {alarm && (
                    <motion.div key="alarm"
                      initial={{ opacity: 0, scale: 0.88, y: 16 }}
                      animate={{ opacity: 1, scale: 1,    y: 0 }}
                      exit={{    opacity: 0, scale: 0.88, y: 16 }}
                      transition={{ type: "spring", stiffness: 350, damping: 26 }}
                      className="m-5 glass-inner rounded-2xl p-6 text-center"
                    >
                      <motion.div
                        animate={{ rotate: [-12, 12, -12, 12, -6, 6, 0] }}
                        transition={{ repeat: Infinity, duration: 0.7, repeatDelay: 1.8 }}
                        className="text-5xl mb-3"
                      >🔔</motion.div>
                      <p className="text-3xl font-bold tracking-tight text-black/85 mb-0.5">8:30 PM</p>
                      <p className="text-sm text-black/45 font-medium mb-1">Time to take your Yaz pill</p>
                      <p className="text-xs text-black/30 mb-5">Day {dn} of {tot}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/35 mb-3">Did you take your pill?</p>
                      <div className="flex gap-3">
                        <button className="ios-btn-primary flex-1 py-3" onClick={() => answer(true)}>✓ Yes</button>
                        <button className="ios-btn-danger flex-1 py-3" onClick={() => answer(false)}>✗ No</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info + tracker */}
                {!alarm && (
                  <div className="p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-black/35 mb-1">Dashboard</p>
                    <h2 className="text-xl font-bold tracking-tight text-black/85 mb-4">Your Progress</h2>

                    {/* Info rows */}
                    <div className="glass-inner rounded-2xl px-4 py-1 mb-4">
                      <Row label="Name"  value={cfg.name} />
                      <Row label="Start" value={formatDate(cfg.startDate)} />
                      <Row label="End"   value={formatDate(cfg.endDate)} />
                      <Row label="Email" value={<span className="text-[10px]">{cfg.email}</span>} />
                      <Row label="Today" value={`Day ${dn} of ${tot}`} />
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Status</span>
                        <Badge variant={todayTaken === true ? "success" : todayTaken === false ? "destructive" : "secondary"}>
                          {todayTaken === true ? "✓ Taken" : todayTaken === false ? "✗ Missed" : "Pending"}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] font-semibold text-black/35 mb-1.5">
                        <span>Progress</span><span>{Math.round(pct)}%</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/8">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #007AFF, #34C8FF)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: "spring", stiffness: 60, damping: 18 }}
                        />
                      </div>
                    </div>

                    {/* Pill grid */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30 mb-2">Pill Tracker</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Array.from({ length: tot }, (_, i) => i + 1).map(d => (
                        <PillCell key={d} d={d} dayNum={dn} taken={taken} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-black/35 font-medium mb-5">
                      <span><span className="text-[#007AFF]">●</span> Taken</span>
                      <span><span className="text-[#FF3B30]">●</span> Missed</span>
                      <span><span className="text-[#007AFF] opacity-50">○</span> Today</span>
                      <span><span className="text-[#FF9500]">●</span> Placebo (25–28)</span>
                    </div>

                    {/* Log today */}
                    {todayTaken === undefined && (
                      <div className="pt-4 border-t border-black/6 mb-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-black/30 mb-3">Log Today's Pill</p>
                        <div className="flex gap-3">
                          <button className="ios-btn-primary flex-1 py-2.5" onClick={() => answer(true)}>✓ Taken</button>
                          <button className="ios-btn-danger flex-1 py-2.5" onClick={() => answer(false)}>✗ Missed</button>
                        </div>
                      </div>
                    )}

                    <button className="ios-btn-secondary w-full py-2.5 text-sm" onClick={reset}>
                      Reset / Change Setup
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
