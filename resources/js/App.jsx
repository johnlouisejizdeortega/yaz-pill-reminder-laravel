import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Pill, Bell, Check, X, RotateCcw, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ── helpers ── */
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
function load() {
  try { return JSON.parse(localStorage.getItem("yazv4")) || {}; } catch { return {}; }
}
function save(o) {
  try { localStorage.setItem("yazv4", JSON.stringify(o)); } catch {}
}
function todayStr() { return new Date().toISOString().split("T")[0]; }

/* ── animation presets ── */
const slide = {
  initial: { opacity: 0, y: 14, scale: 0.99 },
  animate: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -14, scale: 0.99 },
};
const spring = { type: "spring", stiffness: 320, damping: 32 };

/* ── sub-components ── */
function Field({ label, error, children }) {
  return (
    <div className="mb-2">
      <Label className="mb-1 block text-[9px] font-semibold text-black/40 uppercase tracking-widest">{label}</Label>
      {children}
      {error && (
        <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
          className="text-[9px] text-black/55 mt-0.5 font-semibold">{error}</motion.p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-black/6 last:border-0">
      <span className="text-[9px] font-semibold text-black/35 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-semibold text-black/75">{value}</span>
    </div>
  );
}

function StatusBadge({ taken }) {
  if (taken === true)
    return <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-black text-white rounded-full px-2 py-0.5"><Check size={8} strokeWidth={3} />Taken</span>;
  if (taken === false)
    return <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-black/8 text-black/55 border border-black/15 rounded-full px-2 py-0.5"><X size={8} strokeWidth={3} />Missed</span>;
  return <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-black/5 text-black/38 border border-black/8 rounded-full px-2 py-0.5">Pending</span>;
}

function PillCell({ d, dayNum, taken }) {
  const placebo = d >= 25;
  const t = taken[d];
  const isToday = d === dayNum && t === undefined;

  let cls = "w-6 h-6 flex items-center justify-center rounded-full cursor-default select-none transition-all flex-shrink-0";
  if (t === true)       cls += " bg-black text-white shadow-sm";
  else if (t === false) cls += " bg-black/6 text-black/30 border border-black/12";
  else if (isToday)     cls += " bg-white text-black border-2 border-black pulse-ring";
  else if (placebo)     cls += " bg-black/7 text-black/35";
  else                  cls += " bg-black/4 text-black/22";

  return (
    <motion.div layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22, delay: d * 0.01 }}
      whileHover={{ scale: 1.12 }}
      className={cls}
    >
      {t === true  ? <Check size={11} strokeWidth={3} /> :
       t === false ? <X     size={10} strokeWidth={3} /> :
       <span className="text-[9px] font-bold">{d}</span>}
    </motion.div>
  );
}

/* ── main ── */
export default function App() {
  const savedRef   = useRef(null);
  if (!savedRef.current) savedRef.current = load();
  const saved = savedRef.current;

  const [page, setPage]   = useState(() => saved.email ? "dash" : "s1");
  const [cfg,  setCfg]    = useState(saved);
  const [taken, setTaken] = useState(saved.taken || {});
  const [now,  setNow]    = useState(new Date());
  const [alarm, setAlarm] = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [errs,  setErrs]  = useState({});
  const [f, setF] = useState({
    name:      saved.name      || "",
    startDate: saved.startDate || "",
    endDate:   saved.endDate   || "",
    email:     saved.email     || "",
  });

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* 8:30 PM alarm */
  useEffect(() => {
    if (!cfg.email) return;
    if (now.getHours() === 20 && now.getMinutes() === 30 && now.getSeconds() === 0) setAlarm(true);
  }, [now, cfg.email]);

  /* sync taken logs from backend — never changes page, only enriches taken map */
  useEffect(() => {
    const { email, startDate, endDate } = saved;
    if (!email || !startDate || !endDate) return;
    fetch(`/api/status/${encodeURIComponent(email)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data?.logs) return;
        const tot = getTotalDays(startDate, endDate);
        const dayMap = {};
        Object.entries(data.logs).forEach(([date, val]) => {
          const s   = new Date(startDate + "T00:00:00");
          const d   = new Date(date       + "T00:00:00");
          const num = Math.floor((d - s) / 86400000) + 1;
          if (num >= 1 && num <= tot) dayMap[num] = val;
        });
        setTaken(prev => {
          const merged = { ...prev, ...dayMap };
          save({ ...saved, taken: merged });
          return merged;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* validation */
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

  /* registration — save locally first, then call API */
  async function activate() {
    if (!validate()) return;
    setBusy(true);

    const nc = { name: f.name, email: f.email, startDate: f.startDate, endDate: f.endDate, taken: {} };
    save(nc);
    savedRef.current = nc;
    setCfg(nc);
    setTaken({});
    setPage("dash");

    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body:    JSON.stringify({ name: f.name, email: f.email, start_date: f.startDate, end_date: f.endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Server error");
      toast.success("Reminders activated — check your email");
    } catch (err) {
      toast.error(`Email reminders may not work: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  /* log pill — optimistic update (save locally first, sync backend after) */
  function answer(yes) {
    const dn = getDayNum(cfg.startDate);
    setAlarm(false);

    /* update locally immediately */
    setTaken(prev => {
      const updated = { ...prev, [dn]: yes };
      save({ ...cfg, taken: updated });
      savedRef.current = { ...cfg, taken: updated };
      return updated;
    });
    toast(yes ? "Logged as taken" : "Logged as missed");

    /* fire-and-forget sync to backend */
    fetch("/api/log", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body:    JSON.stringify({ email: cfg.email, log_date: todayStr(), taken: yes }),
    }).catch(() => {});
  }

  /* reset */
  async function reset() {
    await fetch(`/api/reset/${encodeURIComponent(cfg.email)}`, { method: "DELETE" }).catch(() => {});
    localStorage.removeItem("yazv4");
    savedRef.current = {};
    setCfg({}); setTaken({}); setAlarm(false); setErrs({});
    setF({ name: "", startDate: "", endDate: "", email: "" });
    setPage("s1");
  }

  const fld = (k) => ({ value: f[k], onChange: e => setF(x => ({ ...x, [k]: e.target.value })) });

  const dn         = cfg.startDate ? getDayNum(cfg.startDate) : 0;
  const tot        = cfg.startDate && cfg.endDate ? getTotalDays(cfg.startDate, cfg.endDate) : 28;
  const pct        = tot > 1 ? Math.min(100, Math.max(0, ((dn - 1) / (tot - 1)) * 100)) : 0;
  const timeStr    = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const todayTaken = taken[dn];

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="glass rounded-3xl flex flex-col overflow-hidden"
        style={{ width: "75vw", height: "75vh", minWidth: 300 }}
      >

        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>

          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ repeat: Infinity, duration: 5, repeatDelay: 4 }}
            className="w-7 h-7 rounded-xl bg-black flex items-center justify-center flex-shrink-0 shadow-sm"
          >
            <Pill size={14} color="#fff" strokeWidth={2} />
          </motion.div>

          <div>
            <h1 className="text-sm font-bold tracking-tight text-black/88 leading-tight">Pill Alarm</h1>
            <p className="text-[9px] text-black/35 font-semibold uppercase tracking-widest">Yaz · 8:30 PM Daily</p>
          </div>

          {cfg.email && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="ml-auto glass-inner rounded-lg px-2 py-1 flex items-center gap-1">
              <Clock size={10} className="text-black/38" strokeWidth={2.5} />
              <span className="text-[10px] font-bold tabular-nums text-black/60 tracking-wide">{timeStr}</span>
            </motion.div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Setup */}
            {page === "s1" && (
              <motion.div key="s1" variants={slide} initial="initial" animate="animate" exit="exit"
                transition={spring} className="p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-black/28 mb-0.5">Setup</p>
                <h2 className="text-base font-bold tracking-tight text-black/88 mb-3">Schedule &amp; Email</h2>
                <Field label="Your Name" error={errs.name}><Input type="text" placeholder="Louise" {...fld("name")} /></Field>
                <Field label="Pill Start Date" error={errs.startDate}><Input type="date" {...fld("startDate")} /></Field>
                <Field label="Pill End Date" error={errs.endDate}><Input type="date" {...fld("endDate")} /></Field>
                <Field label="Reminder Email" error={errs.email}><Input type="email" placeholder="you@gmail.com" {...fld("email")} /></Field>
                <p className="text-[10px] text-black/30 mb-3 leading-snug font-medium">
                  Reminders sent at 8:00, 8:10, 8:20 &amp; 8:30 PM daily — even when this tab is closed.
                </p>
                <button className="btn-primary w-full h-9 text-xs" onClick={activate} disabled={busy}>
                  {busy ? "Activating…" : "Activate Reminder"}
                </button>
              </motion.div>
            )}

            {/* Dashboard */}
            {page === "dash" && (
              <motion.div key="dash" variants={slide} initial="initial" animate="animate" exit="exit" transition={spring}>

                {/* Alarm */}
                <AnimatePresence>
                  {alarm && (
                    <motion.div key="alarm"
                      initial={{ opacity: 0, scale: 0.90, y: 14 }}
                      animate={{ opacity: 1, scale: 1,    y: 0  }}
                      exit={{    opacity: 0, scale: 0.90, y: 14 }}
                      transition={{ type: "spring", stiffness: 350, damping: 26 }}
                      className="m-3 glass-inner rounded-2xl p-4 text-center"
                    >
                      <motion.div
                        animate={{ rotate: [-14, 14, -14, 14, -7, 7, 0] }}
                        transition={{ repeat: Infinity, duration: 0.65, repeatDelay: 1.8 }}
                        className="flex justify-center mb-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-lg">
                          <Bell size={18} color="#fff" strokeWidth={1.8} />
                        </div>
                      </motion.div>
                      <p className="text-xl font-bold tracking-tight text-black/88 mb-0.5">8:30 PM</p>
                      <p className="text-xs text-black/42 font-medium mb-0.5">Time to take your Yaz pill</p>
                      <p className="text-[10px] text-black/26 mb-3">Day {dn} of {tot}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 mb-2">Did you take it?</p>
                      <div className="flex gap-2">
                        <button className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1" onClick={() => answer(true)}><Check size={12} strokeWidth={3} />Yes</button>
                        <button className="btn-danger  flex-1 py-2 text-xs flex items-center justify-center gap-1" onClick={() => answer(false)}><X     size={12} strokeWidth={3} />No</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!alarm && (
                  <div className="p-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-black/28 mb-0.5">Dashboard</p>
                    <h2 className="text-base font-bold tracking-tight text-black/88 mb-2">Your Progress</h2>

                    <div className="glass-inner rounded-xl px-3 py-0.5 mb-3">
                      <Row label="Name"  value={cfg.name} />
                      <Row label="Start" value={formatDate(cfg.startDate)} />
                      <Row label="End"   value={formatDate(cfg.endDate)} />
                      <Row label="Email" value={<span className="text-[9px]">{cfg.email}</span>} />
                      <Row label="Today" value={`Day ${dn} of ${tot}`} />
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[9px] font-semibold text-black/35 uppercase tracking-wider">Status</span>
                        <StatusBadge taken={todayTaken} />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-[9px] font-bold text-black/32 mb-1">
                        <span>Course Progress</span><span>{Math.round(pct)}%</span>
                      </div>
                      <div className="relative h-1 w-full overflow-hidden rounded-full bg-black/8">
                        <motion.div className="h-full rounded-full bg-black"
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ type: "spring", stiffness: 60, damping: 18 }} />
                      </div>
                    </div>

                    <p className="text-[9px] font-bold uppercase tracking-widest text-black/26 mb-1.5">Pill Tracker</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Array.from({ length: tot }, (_, i) => i + 1).map(d => (
                        <PillCell key={d} d={d} dayNum={dn} taken={taken} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[9px] text-black/30 font-semibold mb-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black inline-block" />Taken</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black/12 border border-black/18 inline-block" />Missed</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border-2 border-black inline-block" />Today</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-black/7 inline-block" />Placebo</span>
                    </div>

                    {todayTaken === undefined && (
                      <div className="pt-2 border-t border-black/5 mb-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-black/26 mb-1.5">Log Today's Pill</p>
                        <div className="flex gap-2">
                          <button className="btn-primary flex-1 py-1.5 text-[11px] flex items-center justify-center gap-1" onClick={() => answer(true)}><Check size={11} strokeWidth={3} />Taken</button>
                          <button className="btn-danger  flex-1 py-1.5 text-[11px] flex items-center justify-center gap-1" onClick={() => answer(false)}><X     size={11} strokeWidth={3} />Missed</button>
                        </div>
                      </div>
                    )}

                    <button className="btn-secondary w-full py-1.5 text-[11px] flex items-center justify-center gap-1.5" onClick={reset}>
                      <RotateCcw size={11} strokeWidth={2.5} />Reset / Change Setup
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
