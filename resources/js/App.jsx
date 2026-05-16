import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
};
const pageTransition = { type: "tween", duration: 0.28, ease: "easeInOut" };

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5 mb-4">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-border py-2.5 text-sm">
      <span className="text-muted-foreground text-xs tracking-wider uppercase">{label}</span>
      <span className="font-semibold text-xs">{value}</span>
    </div>
  );
}

function PillCell({ d, dayNum, taken }) {
  const placebo = d >= 25;
  const t = taken[d];
  const isToday = d === dayNum && t === undefined;

  let bg = "bg-secondary", border = "border border-border";
  let textColor = placebo ? "text-amber-500" : "text-muted-foreground";
  let label = d;

  if (t === true)  { bg = "bg-primary";  border = "border border-primary";       textColor = "text-primary-foreground"; label = "✓"; }
  if (t === false) { bg = "bg-white";    border = "border-2 border-destructive"; textColor = "text-destructive";        label = "✗"; }
  if (isToday)     { bg = "bg-white";    border = "border-2 border-primary";     textColor = "text-primary"; }

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: t !== undefined ? [1, 1.2, 1] : 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: d * 0.01 }}
      whileHover={{ scale: 1.15, zIndex: 10 }}
      className={`w-8 h-8 flex items-center justify-center text-[10px] rounded-sm cursor-default select-none ${bg} ${border} ${textColor} ${d === dayNum ? "font-bold" : "font-normal"}`}
    >
      {label}
    </motion.div>
  );
}

function Grid({ total, dayNum, taken }) {
  return (
    <div className="mt-5">
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3 pb-2 border-b border-border">— Pill Tracker —</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map(d => (
          <PillCell key={d} d={d} dayNum={dayNum} taken={taken} />
        ))}
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
        ■ taken &nbsp;|&nbsp; ✗ missed &nbsp;|&nbsp; □ today &nbsp;|&nbsp; <span className="text-amber-500">■</span> placebo (25–28)
      </div>
    </div>
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

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!cfg.email) return;
    const hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds();
    if (hh === 20 && mm === 30 && ss === 0) setAlarm(true);
  }, [now, cfg]);

  // Sync logs from server on mount
  useEffect(() => {
    if (!cfg.email) return;
    fetch(`/api/status/${encodeURIComponent(cfg.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
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
      toast.success("✅ Active! Welcome email sent.");
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
      toast(yes ? "Logged: Taken ✓" : "Logged: Missed ✗");
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

  const dn  = cfg.startDate ? getDayNum(cfg.startDate) : 0;
  const tot = cfg.startDate && cfg.endDate ? getTotalDays(cfg.startDate, cfg.endDate) : 28;
  const pct = tot > 1 ? Math.min(100, Math.max(0, ((dn - 1) / (tot - 1)) * 100)) : 0;
  const timeStr    = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const todayTaken = taken[dn];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="text-center mb-7 w-full max-w-md">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Yaz · Drospirenone + Ethinylestradiol</p>
        <h1 className="text-3xl font-bold tracking-tight">💊 Pill Alarm</h1>
        <p className="text-xs text-muted-foreground mt-1">8:30 PM Daily Reminder</p>
        {cfg.email && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mt-3 inline-block border-2 border-primary px-6 py-1.5 text-xl font-bold tracking-widest">
            {timeStr}
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">

          {page === "s1" && (
            <motion.div key="s1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <Card>
                <CardHeader>
                  <CardDescription className="text-[10px] tracking-widest uppercase">Setup</CardDescription>
                  <CardTitle className="text-base tracking-wide">Schedule & Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <Field label="Your Name" error={errs.name}>
                    <Input type="text" placeholder="Louise" {...fld("name")} />
                  </Field>
                  <Field label="Pill Start Date" error={errs.startDate}>
                    <Input type="date" {...fld("startDate")} />
                  </Field>
                  <Field label="Pill End Date" error={errs.endDate}>
                    <Input type="date" {...fld("endDate")} />
                  </Field>
                  <Field label="Reminder Email Address" error={errs.email}>
                    <Input type="email" placeholder="you@gmail.com" {...fld("email")} />
                  </Field>
                  <p className="text-[10px] text-muted-foreground pb-3 leading-relaxed">
                    Emails sent at 8:00 · 8:10 · 8:20 · 8:30 PM daily — even when this tab is closed.
                  </p>
                  <Button className="w-full" onClick={activate} disabled={busy}>
                    {busy ? "Activating..." : "Activate Reminder →"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {page === "dash" && (
            <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
              <AnimatePresence>
                {alarm && (
                  <motion.div key="alarm" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                    <Card className="border-2 border-primary mb-5">
                      <CardContent className="pt-6 text-center">
                        <motion.div animate={{ rotate: [-8, 8, -8, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 1.5 }} className="text-5xl mb-3">🔔</motion.div>
                        <p className="text-3xl font-bold tracking-widest mb-1">8:30 PM</p>
                        <p className="text-sm text-muted-foreground mb-1">Time to take your Yaz pill</p>
                        <p className="text-xs text-muted-foreground mb-5">Day {dn} of {tot}</p>
                        <p className="text-xs font-bold tracking-widest mb-3 uppercase">Did you take your pill?</p>
                        <div className="flex gap-3">
                          <Button className="flex-1 text-base h-12" onClick={() => answer(true)}>✓ Yes</Button>
                          <Button variant="outline" className="flex-1 text-base h-12 border-2" onClick={() => answer(false)}>✗ No</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {!alarm && (
                <Card>
                  <CardHeader>
                    <CardDescription className="text-[10px] tracking-widest uppercase">Dashboard</CardDescription>
                    <CardTitle className="text-base tracking-wide">Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Row label="Name"  value={cfg.name} />
                    <Row label="Start" value={formatDate(cfg.startDate)} />
                    <Row label="End"   value={formatDate(cfg.endDate)} />
                    <Row label="Email" value={<span className="text-[11px]">{cfg.email}</span>} />
                    <Row label="Today" value={`Day ${dn} / ${tot}`} />
                    <div className="flex justify-between items-center border-b border-border py-2.5">
                      <span className="text-muted-foreground text-xs tracking-wider uppercase">Today's Status</span>
                      <Badge variant={todayTaken === true ? "default" : todayTaken === false ? "destructive" : "secondary"}>
                        {todayTaken === true ? "✓ Taken" : todayTaken === false ? "✗ Missed" : "— Pending —"}
                      </Badge>
                    </div>

                    <div className="mt-4 mb-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>Progress</span><span>{Math.round(pct)}%</span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 18 }} />
                      </div>
                    </div>

                    <Grid total={tot} dayNum={dn} taken={taken} />

                    {todayTaken === undefined && (
                      <div className="mt-6 border-t border-border pt-4">
                        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">— Log Today's Pill —</p>
                        <div className="flex gap-3">
                          <Button className="flex-1 h-11 text-sm" onClick={() => answer(true)}>✓ Yes</Button>
                          <Button variant="outline" className="flex-1 h-11 text-sm border-2" onClick={() => answer(false)}>✗ No</Button>
                        </div>
                      </div>
                    )}

                    <Button variant="outline" className="w-full mt-5" onClick={reset}>Reset / Change Setup</Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
