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
function save(o) { localStorage.setItem("yazv4", JSON.stringify(o)); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

/* ── animation presets ── */
const slide = {
  initial: { opacity: 0, y: 14, scale: 0.99 },
  animate: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -14, scale: 0.99 },
};
const spring = { type: "spring", stiffness: 320, damping: 32 };

/* ── small components ── */
function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      <Label className="mb-1.5 block text-[10px] font-semibold text-black/40 uppercase tracking-widest">{label}</Label>
      {children}
      {error && (
        <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-black/60 mt-1 font-semibold">{error}</motion.p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-black/6 last:border-0">
      <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-semibold text-black/75">{value}</span>
    </div>
  );
}

function StatusBadge({ taken }) {
  if (taken === true)
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black text-white rounded-full px-2.5 py-0.5"><Check size={9} strokeWidth={3} /> Taken</span>;
  if (taken === false)
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-black/8 text-black/60 border border-black/15 rounded-full px-2.5 py-0.5"><X size={9} strokeWidth={3} /> Missed</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-black/5 text-black/40 border border-black/10 rounded-full px-2.5 py-0.5">Pending</span>;
}

function PillCell({ d, dayNum, taken }) {
  const placebo = d >= 25;
  const t = taken[d];
  const isToday = d === dayNum && t === undefined;

  let cls = "w-8 h-8 flex items-center justify-center rounded-full cursor-default select-none transition-all flex-shrink-0";

  if (t === true)       cls += " bg-black text-white shadow-sm";
  else if (t === false) cls += " bg-black/6 text-black/35 border border-black/15";
  else if (isToday)     cls += " bg-white text-black border-2 border-black pulse-ring";
  else if (placebo)     cls += " bg-black/8 text-black/40";
  else                  cls += " bg-black/5 text-black/25";

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22, delay: d * 0.01 }}
      whileHover={{ scale: 1.12 }}
      className={cls}
    >
      {t === true
        ? <Check size={13} strokeWidth={3} />
        : t === false
          ? <X size={12} strokeWidth={3} />
          : <span className="text-[10px] font-bold">{d}</span>
      }
    </motion.div>
  );
}

/* ── main app ── */
export default function App() {
  const saved      = useRef(load()).current;
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

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* 8:30 PM alarm trigger */
  useEffect(() => {
    if (!cfg.email) return;
    const hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds();
    if (hh === 20 && mm === 30 && ss === 0) setAlarm(true);
  }, [now, cfg.email]);

  /* sync taken logs from backend on mount */
  useEffect(() => {
    const email = saved.email;
    if (!email) return;
    fetch(`/api/status/${encodeURIComponent(email)}`)
      .then(r => {
        if (r.status === 404) return "not_found";
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (data === "not_found") {
          /* User not in DB (DB was reset) — keep form pre-filled, ask to re-activate */
          setPage("s1");
          return;
        }
        if (!data) return; /* server error — leave localStorage as-is */
        const dayMap = {};
        const tot = getTotalDays(saved.startDate, saved.endDate);
        Object.entries(data.logs).forEach(([date, takenVal]) => {
          const s = new Date(saved.startDate + "T00:00:00");
          const d = new Date(date + "T00:00:00");
          const dayNum = Math.floor((d - s) / 86400000) + 1;
          if (dayNum >= 1 && dayNum <= tot) dayMap[dayNum] = takenVal;
        });
        setTaken(dayMap);
        save({ ...saved, taken: dayMap });
      })
      .catch(() => {}); /* network error — leave localStorage as-is */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* form helpers */
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
        method:  "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body:    JSON.stringify({ name: f.name, email: f.email, start_date: f.startDate, end_date: f.endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      const nc = { name: f.name, email: f.email, startDate: f.startDate, endDate: f.endDate, taken: {} };
      save(nc);
      setCfg(nc);
      setTaken({});
      toast.success("Reminders activated — check your email");
      setPage("dash");
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function answer(yes) {
    const dn = getDayNum(cfg.startDate);
    setAlarm(false);
    try {
      await fetch("/api/log", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body:    JSON.stringify({ email: cfg.email, log_date: todayStr(), taken: yes }),
      });
      setTaken(prev => {
        const updated = { ...prev, [dn]: yes };
        save({ ...cfg, taken: updated });
        return updated;
      });
      toast(yes ? "Logged as taken" : "Logged as missed");
    } catch {
      toast.error("Failed to log — try again");
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

  const dn         = cfg.startDate ? getDayNum(cfg.startDate) : 0;
  const tot        = cfg.startDate && cfg.endDate ? getTotalDays(cfg.startDate, cfg.endDate) : 28;
  const pct        = tot > 1 ? Math.min(100, Math.max(0, ((dn - 1) / (tot - 1)) * 100)) : 0;
  const timeStr    = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const todayTaken = taken[dn];

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">

      {/* 75 vw × 75 vh glass panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="glass rounded-3xl flex flex-col overflow-hidden"
        style={{ width: "75vw", height: "75vh", minWidth: 300 }}
      >

        {/* ── Header bar ── */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>

          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ repeat: Infinity, duration: 5, repeatDelay: 4 }}
            className="w-9 h-9 rounded-2xl bg-black flex items-center justify-center flex-shrink-0 shadow-sm"
          >
            <Pill size={18} color="#fff" strokeWidth={2} />
          </motion.div>

          <div>
            <h1 className="text-base font-bold tracking-tight text-black/90 leading-tight">Pill Alarm</h1>
            <p className="text-[10px] text-black/38 font-semibold uppercase tracking-widest">Yaz · 8:30 PM Daily</p>
          </div>

          {cfg.email && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="ml-auto glass-inner rounded-xl px-3 py-1.5 flex items-center gap-1.5"
            >
              <Clock size={11} className="text-black/40" strokeWidth={2.5} />
              <span className="text-xs font-bold tabular-nums text-black/65 tracking-wide">{timeStr}</span>
            </motion.div>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">

            {/* ────── Setup ────── */}
            {page === "s1" && (
              <motion.div key="s1" variants={slide} initial="initial" animate="animate" exit="exit"
                transition={spring} className="p-6">

                <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-0.5">Step 1</p>
                <h2 className="text-xl font-bold tracking-tight text-black/88 mb-5">Schedule &amp; Email</h2>

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

                <p className="text-[11px] text-black/32 mb-5 leading-relaxed font-medium">
                  Reminders sent at 8:00, 8:10, 8:20 &amp; 8:30 PM daily — even when this tab is closed.
                </p>

                <button className="btn-primary w-full h-11" onClick={activate} disabled={busy}>
                  {busy ? "Activating…" : "Activate Reminder"}
                </button>
              </motion.div>
            )}

            {/* ────── Dashboard ────── */}
            {page === "dash" && (
              <motion.div key="dash" variants={slide} initial="initial" animate="animate" exit="exit"
                transition={spring}>

                {/* Alarm overlay */}
                <AnimatePresence>
                  {alarm && (
                    <motion.div key="alarm"
                      initial={{ opacity: 0, scale: 0.90, y: 14 }}
                      animate={{ opacity: 1, scale: 1,    y: 0  }}
                      exit={{    opacity: 0, scale: 0.90, y: 14 }}
                      transition={{ type: "spring", stiffness: 350, damping: 26 }}
                      className="m-5 glass-inner rounded-2xl p-6 text-center"
                    >
                      <motion.div
                        animate={{ rotate: [-14, 14, -14, 14, -7, 7, 0] }}
                        transition={{ repeat: Infinity, duration: 0.65, repeatDelay: 1.8 }}
                        className="flex justify-center mb-3"
                      >
                        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-lg">
                          <Bell size={26} color="#fff" strokeWidth={1.8} />
                        </div>
                      </motion.div>
                      <p className="text-3xl font-bold tracking-tight text-black/88 mb-0.5">8:30 PM</p>
                      <p className="text-sm text-black/45 font-medium mb-1">Time to take your Yaz pill</p>
                      <p className="text-xs text-black/28 mb-5">Day {dn} of {tot}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/32 mb-3">Did you take your pill?</p>
                      <div className="flex gap-3">
                        <button className="btn-primary flex-1 py-3 flex items-center justify-center gap-1.5"
                          onClick={() => answer(true)}>
                          <Check size={14} strokeWidth={3} /> Yes
                        </button>
                        <button className="btn-danger flex-1 py-3 flex items-center justify-center gap-1.5"
                          onClick={() => answer(false)}>
                          <X size={14} strokeWidth={3} /> No
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main dashboard */}
                {!alarm && (
                  <div className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-0.5">Dashboard</p>
                    <h2 className="text-xl font-bold tracking-tight text-black/88 mb-4">Your Progress</h2>

                    {/* Info rows */}
                    <div className="glass-inner rounded-2xl px-4 py-1 mb-4">
                      <Row label="Name"  value={cfg.name} />
                      <Row label="Start" value={formatDate(cfg.startDate)} />
                      <Row label="End"   value={formatDate(cfg.endDate)} />
                      <Row label="Email" value={<span className="text-[10px]">{cfg.email}</span>} />
                      <Row label="Today" value={`Day ${dn} of ${tot}`} />
                      <div className="flex justify-between items-center py-2">
                        <span className="text-[10px] font-semibold text-black/35 uppercase tracking-wider">Status</span>
                        <StatusBadge taken={todayTaken} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] font-bold text-black/35 mb-1.5">
                        <span>Course Progress</span><span>{Math.round(pct)}%</span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/8">
                        <motion.div
                          className="h-full rounded-full bg-black"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: "spring", stiffness: 60, damping: 18 }}
                        />
                      </div>
                    </div>

                    {/* Pill grid */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/28 mb-2">Pill Tracker</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {Array.from({ length: tot }, (_, i) => i + 1).map(d => (
                        <PillCell key={d} d={d} dayNum={dn} taken={taken} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] text-black/32 font-semibold mb-5">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-black inline-block" /> Taken</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-black/15 border border-black/20 inline-block" /> Missed</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-black inline-block" /> Today</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-black/8 inline-block" /> Placebo</span>
                    </div>

                    {/* Log today */}
                    {todayTaken === undefined && (
                      <div className="pt-4 border-t border-black/6 mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/28 mb-3">Log Today's Pill</p>
                        <div className="flex gap-3">
                          <button className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-1.5"
                            onClick={() => answer(true)}>
                            <Check size={13} strokeWidth={3} /> Taken
                          </button>
                          <button className="btn-danger flex-1 py-2.5 flex items-center justify-center gap-1.5"
                            onClick={() => answer(false)}>
                            <X size={13} strokeWidth={3} /> Missed
                          </button>
                        </div>
                      </div>
                    )}

                    <button className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2"
                      onClick={reset}>
                      <RotateCcw size={13} strokeWidth={2.5} /> Reset / Change Setup
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
