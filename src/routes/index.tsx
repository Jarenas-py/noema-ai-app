import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, ChevronRight, Circle, Fingerprint, Focus, Home,
  Lock, MessageCircle, Mic, Moon, Send, Shield, Sparkles, Sun, Timer,
  User, Users, X, Check, ArrowRight, ArrowLeft, Play, Pause, Zap,
  ChevronDown, Activity, Eye, EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Noema — Connect Better, Not More" }] }),
  component: NoemaApp,
});

/* ============== MOCK DATA ============== */

type Tier = "Inner Circle" | "Collaborators" | "Acquaintances";
type Contact = {
  id: string;
  name: string;
  initials: string;
  tier: Tier;
  closeness: number; // 1-100
  urgency: "Immediate" | "Delayed" | "Weakened";
  lastMessage: string;
  lastSeen: string;
  hue: number;
};

const INITIAL_CONTACTS: Contact[] = [
  { id: "c1", name: "Elena K.", initials: "EK", tier: "Inner Circle", closeness: 94, urgency: "Immediate", lastMessage: "Family · response overdue 2h", lastSeen: "12m ago", hue: 150 },
  { id: "c2", name: "Sophie L.", initials: "SL", tier: "Inner Circle", closeness: 88, urgency: "Immediate", lastMessage: "Need to reschedule coffee. Is 4pm okay?", lastSeen: "2m ago", hue: 155 },
  { id: "c3", name: "Marcus J.", initials: "MJ", tier: "Collaborators", closeness: 62, urgency: "Delayed", lastMessage: "Shared the Q3 deck — LMK your thoughts", lastSeen: "1h ago", hue: 60 },
  { id: "c4", name: "Alex K.", initials: "AK", tier: "Acquaintances", closeness: 34, urgency: "Weakened", lastMessage: "Hey, long time. How've you been?", lastSeen: "3d ago", hue: 15 },
  { id: "c5", name: "Lin P.", initials: "LP", tier: "Inner Circle", closeness: 81, urgency: "Delayed", lastMessage: "Loved the photos from the trip", lastSeen: "5h ago", hue: 150 },
  { id: "c6", name: "Diego R.", initials: "D", tier: "Collaborators", closeness: 70, urgency: "Delayed", lastMessage: "Standup moved to 10:30 tomorrow", lastSeen: "45m ago", hue: 150 },
  { id: "c7", name: "Mira", initials: "M", tier: "Acquaintances", closeness: 41, urgency: "Weakened", lastMessage: "Happy birthday!! 🎉", lastSeen: "1w ago", hue: 220 },
  { id: "c8", name: "Jake R.", initials: "JR", tier: "Collaborators", closeness: 58, urgency: "Immediate", lastMessage: "Time-sensitive: needs the Q3 report by noon", lastSeen: "30m ago", hue: 45 },
];

type Notif = { id: string; kind: "message" | "app" | "system"; from: string; preview: string; importance: "High" | "Medium" | "Low"; time: string };
const INITIAL_NOTIFS: Notif[] = [
  { id: "n1", kind: "message", from: "Sophie L.", preview: "Need to reschedule coffee. Is 4pm okay?", importance: "High", time: "2m" },
  { id: "n2", kind: "app", from: "Slack · #design", preview: "12 new messages in a thread you follow", importance: "Medium", time: "18m" },
  { id: "n3", kind: "message", from: "Marcus J.", preview: "Shared the Q3 deck — LMK your thoughts", importance: "Medium", time: "1h" },
  { id: "n4", kind: "app", from: "Instagram", preview: "3 people started following you", importance: "Low", time: "3h" },
];

type Task = { id: string; label: string; done: boolean };
const INITIAL_TASKS: Task[] = [
  { id: "t1", label: "Finish quarterly report draft", done: false },
  { id: "t2", label: "Review architecture doc from Marcus", done: false },
  { id: "t3", label: "Reply to Elena about the weekend", done: false },
];

const BLOCKABLE_APPS = ["Instagram", "Twitter/X", "TikTok", "Reddit", "YouTube", "Facebook", "Snapchat", "WhatsApp", "Messenger", "Email"];

type ChatMsg = { id: string; from: "noema" | "user"; text: string; time: string };

/* ============== SHARED UI ============== */

const Screen = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`h-full w-full overflow-y-auto overflow-x-hidden px-5 pb-28 pt-6 ${className}`}>{children}</div>
);

const Header = ({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) => (
  <div className="mb-6 flex items-start justify-between">
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">NOEMA // {subtitle ?? "V1.0"}</div>
      <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{title}</h1>
    </div>
    {right}
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-xl hover-lift ${className}`}>{children}</div>
);


const Tag = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" | "danger" | "ok" | "accent" }) => {
  const tones = {
    muted: "border-border text-muted",
    warn: "border-warn/40 text-warn",
    danger: "border-danger/40 text-danger",
    ok: "border-ok/40 text-ok",
    accent: "border-accent/50 text-accent",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${tones[tone]}`}>{children}</span>;
};

/* ============== APP ROOT ============== */

type ScreenKey =
  | "welcome" | "login" | "register" | "dashboard" | "companion"
  | "focus-prompt" | "focus-active" | "triage" | "planner" | "battery" | "bubble";

function NoemaApp() {
  const [screen, setScreen] = useState<ScreenKey>("welcome");
  const [dark, setDark] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [contacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);
  const [triageReplies, setTriageReplies] = useState(0);
  const [focusMinutesLogged, setFocusMinutesLogged] = useState(0);

  // Focus session
  const [focusDuration, setFocusDuration] = useState(120); // minutes
  const [focusBlocked, setFocusBlocked] = useState<string[]>(["Instagram", "Twitter/X", "TikTok", "Reddit", "YouTube"]);
  const [focusGoal, setFocusGoal] = useState("");
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);

  const tasksDone = tasks.filter(t => t.done).length;

  // battery calculation
  const battery = useMemo(() => {
    const base = 100;
    const drainReplies = triageReplies * 6;
    const drainNotifs = (INITIAL_NOTIFS.length - notifs.length) * 3;
    const recoverTasks = tasksDone * 4;
    const recoverFocus = Math.min(20, focusMinutesLogged / 6);
    const v = Math.max(5, Math.min(100, base - drainReplies - drainNotifs + recoverTasks + recoverFocus - 45));
    return Math.round(v);
  }, [triageReplies, notifs.length, tasksDone, focusMinutesLogged]);

  // focus countdown
  useEffect(() => {
    if (!focusRunning) return;
    const id = setInterval(() => {
      setFocusRemaining(r => {
        if (r <= 1) { setFocusRunning(false); setFocusMinutesLogged(m => m + focusDuration); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [focusRunning, focusDuration]);

  const startFocus = () => {
    setFocusRemaining(focusDuration * 60);
    setFocusRunning(true);
    setScreen("focus-active");
  };

  const goto = (s: ScreenKey) => setScreen(s);

  // Screens that hide the tab bar
  const chromeless = ["welcome", "login", "register", "focus-active"].includes(screen);

  return (
    <div className={dark ? "" : "light"}>
      <div className="min-h-screen w-full bg-background text-foreground flex justify-center">
        {/* Phone frame */}
        <div className="relative w-full max-w-[430px] min-h-screen md:my-6 md:min-h-[900px] md:max-h-[900px] md:rounded-[44px] md:border md:border-border md:overflow-hidden md:shadow-2xl grid-bg">

          {/* scanline */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden md:rounded-[44px]">
            <div className="absolute inset-x-0 h-24 opacity-[0.04] bg-gradient-to-b from-transparent via-foreground to-transparent" style={{ animation: "noema-scan 12s linear infinite" }} />
          </div>

          <div className="relative z-20 h-screen md:h-[900px] pt-6">
            <div key={screen} className="screen-enter h-full">
            {screen === "welcome" && <WelcomeScreen onStart={() => goto("login")} />}
            {screen === "login" && <LoginScreen onLogin={() => goto("dashboard")} onRegister={() => goto("register")} />}
            {screen === "register" && <RegisterScreen onDone={() => goto("dashboard")} />}
            {screen === "dashboard" && (
              <DashboardScreen
                battery={battery} notifs={notifs} setNotifs={setNotifs}
                focusRunning={focusRunning} focusRemaining={focusRemaining}
                onGo={goto} dark={dark} setDark={setDark} tasksDone={tasksDone} totalTasks={tasks.length}
              />
            )}
            {screen === "companion" && <CompanionScreen battery={battery} heldCount={INITIAL_NOTIFS.length - notifs.length} />}
            {screen === "focus-prompt" && (
              <FocusPromptScreen
                duration={focusDuration} setDuration={setFocusDuration}
                blocked={focusBlocked} setBlocked={setFocusBlocked}
                goal={focusGoal} setGoal={setFocusGoal}
                onStart={startFocus}
              />
            )}
            {screen === "focus-active" && (
              <FocusActiveScreen
                remaining={focusRemaining} total={focusDuration * 60}
                running={focusRunning} setRunning={setFocusRunning}
                goal={focusGoal} blocked={focusBlocked}
                onExit={() => { setFocusRunning(false); goto("dashboard"); }}
              />
            )}
            {screen === "triage" && <TriageScreen contacts={contacts} onReply={() => setTriageReplies(r => r + 1)} />}
            {screen === "planner" && <PlannerScreen tasks={tasks} setTasks={setTasks} focusMinutes={focusMinutesLogged} />}
            {screen === "battery" && <BatteryScreen value={battery} triageReplies={triageReplies} tasksDone={tasksDone} focusMinutes={focusMinutesLogged} />}
            {screen === "bubble" && <BubbleScreen contacts={contacts} />}
            </div>
          </div>


          {!chromeless && <TabBar current={screen} onChange={goto} />}
        </div>
      </div>
    </div>
  );
}

/* ============== TAB BAR ============== */

function TabBar({ current, onChange }: { current: ScreenKey; onChange: (s: ScreenKey) => void }) {
  const tabs: { key: ScreenKey; icon: React.ElementType; label: string }[] = [
    { key: "dashboard", icon: Home, label: "Hub" },
    { key: "companion", icon: Sparkles, label: "Noema" },
    { key: "triage", icon: MessageCircle, label: "Triage" },
    { key: "bubble", icon: Users, label: "Bubble" },
    { key: "focus-prompt", icon: Focus, label: "Focus" },
  ];
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-4">
      <div className="mx-auto flex items-center justify-between rounded-full border border-border bg-surface/80 px-2 py-2 backdrop-blur-2xl">
        {tabs.map(({ key, icon: Icon, label }) => {
          const active = current === key || (key === "focus-prompt" && current === "focus-active") || (key === "bubble" && current === "battery") || (key === "triage" && current === "planner");
          return (
            <button key={key} onClick={() => onChange(key)}
              className={`group relative flex-1 flex flex-col items-center gap-0.5 rounded-full px-2 py-1.5 transition ${active ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="font-mono text-[9px] uppercase tracking-widest">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============== WELCOME ============== */

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between px-6 pb-10 pt-10">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">NOEMA // V1.0</div>
        <div className="h-2 w-2 rounded-full bg-accent noema-pulse" />
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-border noema-pulse" />
          <div className="absolute inset-4 rounded-full border border-border noema-pulse" style={{ animationDelay: "0.6s" }} />
          <div className="absolute inset-10 rounded-full border border-accent/60 noema-pulse" style={{ animationDelay: "1.2s" }} />
          <div className="relative h-6 w-6 rounded-full bg-foreground shadow-[0_0_40px_currentColor]" />
        </div>
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">an ambient companion</div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
            Connect better,<br /><span className="italic text-muted">not more.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Noema is your quiet interface with the people who matter. It holds noise. It surfaces meaning.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button onClick={onStart} className="group flex w-full items-center justify-between rounded-full bg-foreground px-6 py-4 text-background transition active:scale-[0.98]">
          <span className="font-medium">Begin</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
        <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted">encrypted · on-device · silent by default</div>
      </div>
    </div>
  );
}

/* ============== LOGIN ============== */

function LoginScreen({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email) && pw.length >= 6;

  return (
    <Screen>
      <Header title="Welcome back" subtitle="AUTH" />
      <div className="space-y-5">
        <Field label="Email" value={email} onChange={setEmail} />
        <Field label="Password" value={pw} onChange={setPw} type={showPw ? "text" : "password"}
          right={<button onClick={() => setShowPw(s => !s)} className="text-muted">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" className="accent-foreground" defaultChecked />Remember device</label>
          <button className="text-muted underline underline-offset-4">Forgot?</button>
        </div>

        <button disabled={!valid} onClick={onLogin} className="w-full rounded-full bg-foreground px-6 py-4 text-background transition active:scale-[0.98] disabled:opacity-30">
          Enter
        </button>

        <div className="flex items-center gap-3 py-2 text-muted"><div className="h-px flex-1 bg-border" /><span className="font-mono text-[10px] uppercase tracking-widest">or</span><div className="h-px flex-1 bg-border" /></div>

        <button onClick={onLogin} className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-surface/40 px-6 py-4 backdrop-blur-xl">
          <Fingerprint className="h-5 w-5 text-accent" />
          <span className="text-sm">Biometric sign-in</span>
        </button>

        <div className="pt-4 text-center text-sm text-muted">
          New here?{" "}
          <button onClick={onRegister} className="text-foreground underline underline-offset-4">Create an account</button>
        </div>
      </div>
    </Screen>
  );
}

function Field({ label, value, onChange, type = "text", right }: { label: string; value: string; onChange: (v: string) => void; type?: string; right?: React.ReactNode }) {
  const filled = value.length > 0;
  return (
    <div className="relative">
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        className="peer w-full rounded-2xl border border-border bg-surface/40 px-4 pb-3 pt-6 text-sm outline-none backdrop-blur-xl transition focus:border-accent"
      />
      <label className={`pointer-events-none absolute left-4 font-mono uppercase tracking-widest transition-all ${filled ? "top-2 text-[9px] text-accent" : "top-4 text-xs text-muted"} peer-focus:top-2 peer-focus:text-[9px] peer-focus:text-accent`}>
        {label}
      </label>
      {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
}

/* ============== REGISTER ============== */

function RegisterScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const focusOptions = ["Family", "Close Friends", "Romantic Partner", "Colleagues", "Deep Work", "Mental Space", "Sleep Recovery"];
  const [focus, setFocus] = useState<string[]>(["Family", "Close Friends", "Deep Work"]);

  const next = () => setStep(s => Math.min(2, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <Screen>
      <Header title="Set up Noema" subtitle={`STEP ${step + 1}/3`} right={
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => <div key={i} className={`h-1 w-6 rounded-full ${i <= step ? "bg-foreground" : "bg-border"}`} />)}
        </div>
      } />

      {step === 0 && (
        <div className="space-y-5">
          <p className="text-sm text-muted">First, an anchor. This is the identity Noema uses to hold your quiet space.</p>
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Password" value={pw} onChange={setPw} type="password" />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Choose your relationship focus. Noema will use this to weight urgency and route noise away.</p>
          <div className="flex flex-wrap gap-2">
            {focusOptions.map(o => {
              const active = focus.includes(o);
              return (
                <button key={o} onClick={() => setFocus(f => active ? f.filter(x => x !== o) : [...f, o])}
                  className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-foreground bg-foreground text-background" : "border-border text-muted"}`}>
                  {active && <Check className="mr-1 inline h-3 w-3" />}{o}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Summary</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Identity</span><span className="truncate max-w-[60%]">{email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted">Focus tiers</span><span>{focus.length}</span></div>
              <div className="flex flex-wrap gap-1 pt-2">{focus.map(f => <Tag key={f}>{f}</Tag>)}</div>
            </div>
          </Card>
          <p className="text-xs text-muted">You can retune these at any time. Noema will start silent and learn from your quiet.</p>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button onClick={back} className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-muted">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
        )}
        <button onClick={step === 2 ? onDone : next} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-background active:scale-[0.98]">
          {step === 2 ? "Enter Noema" : "Continue"}<ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Screen>
  );
}

/* ============== DASHBOARD ============== */

function DashboardScreen({
  battery, notifs, setNotifs, focusRunning, focusRemaining, onGo, dark, setDark, tasksDone, totalTasks,
}: {
  battery: number; notifs: Notif[]; setNotifs: React.Dispatch<React.SetStateAction<Notif[]>>;
  focusRunning: boolean; focusRemaining: number; onGo: (s: ScreenKey) => void;
  dark: boolean; setDark: (v: boolean) => void; tasksDone: number; totalTasks: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hi = notifs.filter(n => n.importance === "High");
  const med = notifs.filter(n => n.importance === "Medium");
  const low = notifs.filter(n => n.importance === "Low");
  const held = INITIAL_NOTIFS.length - notifs.length;

  return (
    <Screen>
      <Header title="Good evening" subtitle="HUB · 19:42" right={
        <button onClick={() => setDark(!dark)} className="rounded-full border border-border p-2 text-muted">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      } />

      {/* Insight card */}
      <Card className="mb-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Noema insight · now</div>
            <p className="mt-2 text-lg font-medium leading-snug">
              You've reached your <span className="italic">social capacity</span> for today. I'm holding {held || 4} non-urgent threads until tomorrow.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => onGo("companion")} className="rounded-full bg-foreground px-4 py-2 text-xs text-background">Accept</button>
              <button onClick={() => onGo("triage")} className="rounded-full border border-border px-4 py-2 text-xs text-muted">View held queue</button>
            </div>
          </div>
          <BatteryRing value={battery} size={72} />
        </div>
      </Card>

      {/* Focus banner */}
      <Card className={`mb-4 p-4 ${focusRunning ? "border-accent/50" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-full border ${focusRunning ? "border-accent text-accent noema-pulse" : "border-border text-muted"}`}>
              <Focus className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Focus mode</div>
              <div className="text-sm">{focusRunning ? `Active · ${Math.ceil(focusRemaining / 60)} min left` : "Not running"}</div>
            </div>
          </div>
          <button onClick={() => onGo(focusRunning ? "focus-active" : "focus-prompt")} className="rounded-full border border-border px-4 py-2 text-xs text-muted">
            {focusRunning ? "Open" : "Start session"}
          </button>
        </div>
      </Card>

      {/* Notification digest */}
      <Card className="mb-4 overflow-hidden">
        <button onClick={() => setExpanded(e => !e)} className="flex w-full items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-muted" />
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Notification digest</div>
            <Tag tone="warn">{notifs.length} pending</Tag>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted transition ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="border-t border-border">
            {[["High", hi, "danger"], ["Medium", med, "warn"], ["Low", low, "muted"]].map(([label, items, tone]: any) => (
              items.length > 0 && (
                <div key={label} className="border-b border-border last:border-0 px-5 py-3">
                  <Tag tone={tone}>{label}</Tag>
                  <div className="mt-2 space-y-2">
                    {items.map((n: Notif) => (
                      <div key={n.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm">{n.from}</div>
                          <div className="truncate text-xs text-muted">{n.preview}</div>
                        </div>
                        <button onClick={() => setNotifs(v => v.filter(x => x.id !== n.id))}
                          className="shrink-0 rounded-full border border-border p-1.5 text-muted"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            {notifs.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted">Silent. Nothing needs you right now.</div>}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={Focus} label="Enter focus" onClick={() => onGo("focus-prompt")} />
        <QuickAction icon={MessageCircle} label="Triage inbox" onClick={() => onGo("triage")} />
        <QuickAction icon={Users} label="Bubble space" onClick={() => onGo("bubble")} />
        <QuickAction icon={Activity} label={`Planner · ${tasksDone}/${totalTasks}`} onClick={() => onGo("planner")} />
      </div>
    </Screen>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center justify-between rounded-2xl border border-border bg-surface/40 p-4 text-left backdrop-blur-xl transition hover:border-accent/40">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted group-hover:text-accent" />
        <span className="text-sm">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted" />
    </button>
  );
}

function BatteryRing({ value, size = 96 }: { value: number; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = value > 60 ? "var(--ok)" : value > 30 ? "var(--warn)" : "var(--danger)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="3" stroke="var(--border)" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="3" stroke={color} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-medium">{value}<span className="text-xs">%</span></div>
        <div className="font-mono text-[8px] uppercase tracking-widest text-muted">energy</div>
      </div>
    </div>
  );
}

/* ============== COMPANION ============== */

function CompanionScreen({ battery, heldCount }: { battery: number; heldCount: number }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "m1", from: "noema", text: "Good evening. I'm holding 4 non-urgent threads for you. Your social battery is at " + battery + "%.", time: "19:42" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const t = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages(m => [...m, { id: `u${m.length}`, from: "user", text, time: t }]);
    setInput("");
    setTimeout(() => {
      const reply = generateReply(text, battery, heldCount);
      setMessages(m => [...m, { id: `n${m.length}`, from: "noema", text: reply, time: t }]);
    }, 700);
  };

  const prompts = ["Summarize missed alerts", "Analyze my social battery", "Prepare my evening wind-down"];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6">
        <Header title="Noema" subtitle="COMPANION · LISTENING" right={
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent noema-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">online</span>
          </div>
        } />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.from === "user" ? "bg-foreground text-background" : "border border-border bg-surface/60 backdrop-blur-xl"}`}>
              {m.from === "noema" && <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted">Noema · {m.time}</div>}
              <div className="leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-background/80 px-5 pb-24 pt-3 backdrop-blur-xl">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {prompts.map(p => (
            <button key={p} onClick={() => send(p)} className="shrink-0 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted backdrop-blur-xl">{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-3 backdrop-blur-xl">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask Noema anything…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
            <Mic className="h-4 w-4 text-muted" />
          </div>
          <button onClick={() => send(input)} className="rounded-full bg-foreground p-3 text-background"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function generateReply(text: string, battery: number, held: number): string {
  const t = text.toLowerCase();
  if (t.includes("summar") || t.includes("miss") || t.includes("alert")) return `You have ${held} threads on hold. One priority: Sophie asked to reschedule coffee to 4pm. Two mediums: Slack thread updates and Marcus's Q3 deck. I'll release the mediums tomorrow morning.`;
  if (t.includes("batter") || t.includes("energy") || t.includes("capacity")) return `You're at ${battery}% social capacity. Two intense triage replies today and a Focus block would recover ~18%. A 20-minute walk typically restores that fully.`;
  if (t.includes("wind") || t.includes("evening") || t.includes("night")) return `I'll silence non-inner-circle channels at 21:00, prep tomorrow's triage, and surface only Elena's overdue reply. Want me to draft a warm one-liner?`;
  return `Noted. I'll hold the noise while you decide.`;
}

/* ============== FOCUS PROMPT ============== */

function FocusPromptScreen({
  duration, setDuration, blocked, setBlocked, goal, setGoal, onStart,
}: {
  duration: number; setDuration: (n: number) => void;
  blocked: string[]; setBlocked: (v: string[]) => void;
  goal: string; setGoal: (v: string) => void; onStart: () => void;
}) {
  const presets = [30, 60, 120, 240];
  return (
    <Screen>
      <Header title="Start a focus session" subtitle="FOCUS · SETUP" />
      <p className="mb-6 text-sm text-muted">Tell Noema your intention. It will silence the world with the precision you allow.</p>

      <div className="mb-6">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Duration</div>
        <div className="mb-3 flex gap-2">
          {presets.map(p => (
            <button key={p} onClick={() => setDuration(p)}
              className={`flex-1 rounded-full border py-3 text-sm ${duration === p ? "border-foreground bg-foreground text-background" : "border-border text-muted"}`}>
              {p >= 60 ? `${p / 60}h` : `${p}m`}
            </button>
          ))}
        </div>
        <input type="range" min={15} max={240} step={15} value={duration} onChange={e => setDuration(+e.target.value)}
          className="w-full accent-foreground" />
        <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted"><span>15m</span><span>{duration >= 60 ? `${(duration / 60).toFixed(duration % 60 ? 1 : 0)}h` : `${duration}m`}</span><span>4h</span></div>
      </div>

      <div className="mb-6">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Block these apps</div>
        <div className="flex flex-wrap gap-2">
          {BLOCKABLE_APPS.map(a => {
            const active = blocked.includes(a);
            return (
              <button key={a} onClick={() => setBlocked(active ? blocked.filter(x => x !== a) : [...blocked, a])}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-foreground bg-foreground text-background" : "border-border text-muted"}`}>
                <Lock className="h-3 w-3" />{a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">What do you want to finish?</div>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
          placeholder="e.g. Finish the quarterly report intro and outline the appendix."
          className="w-full resize-none rounded-2xl border border-border bg-surface/40 p-4 text-sm outline-none backdrop-blur-xl focus:border-accent" />
      </div>

      <button onClick={onStart} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-background active:scale-[0.98]">
        <Play className="h-4 w-4" />Begin focus
      </button>
    </Screen>
  );
}

/* ============== FOCUS ACTIVE ============== */

function FocusActiveScreen({ remaining, total, running, setRunning, goal, blocked, onExit }: {
  remaining: number; total: number; running: boolean; setRunning: (v: boolean) => void;
  goal: string; blocked: string[]; onExit: () => void;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const goals = goal ? goal.split(/[\n.]+/).filter(g => g.trim().length > 3) : ["Deep work — no interruptions"];
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const pct = total > 0 ? (1 - remaining / total) : 0;
  const c = 2 * Math.PI * 130;

  return (
    <div className="flex h-full flex-col px-6 pb-10 pt-10">
      <div className="mb-4 flex items-center justify-between">
        <Tag tone="accent"><Shield className="h-3 w-3" />protected</Tag>
        <button onClick={onExit} className="rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">End</button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <svg width={300} height={300} className="-rotate-90">
            <circle cx={150} cy={150} r={130} strokeWidth="1" stroke="var(--border)" fill="none" />
            <circle cx={150} cy={150} r={130} strokeWidth="2" stroke="var(--accent)" fill="none"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">remaining</div>
            <div className="mt-2 font-mono text-6xl font-light tabular-nums tracking-tight">{String(mm).padStart(2, "0")}<span className="text-muted">:</span>{String(ss).padStart(2, "0")}</div>
            <div className="mt-2 h-2 w-2 rounded-full bg-accent noema-pulse" />
          </div>
        </div>

        <div className="mt-8 w-full max-w-xs space-y-2">
          {goals.slice(0, 4).map((g, i) => (
            <button key={i} onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-3 text-left backdrop-blur-xl">
              <div className={`grid h-5 w-5 place-items-center rounded-md border ${checked[i] ? "border-accent bg-accent text-background" : "border-border"}`}>
                {checked[i] && <Check className="h-3 w-3" />}
              </div>
              <span className={`flex-1 text-sm ${checked[i] ? "text-muted line-through" : ""}`}>{g.trim()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {blocked.slice(0, 6).map(a => <Tag key={a}><Lock className="h-3 w-3" />{a}</Tag>)}
          {blocked.length > 6 && <Tag>+{blocked.length - 6}</Tag>}
        </div>
        <button onClick={() => setRunning(!running)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface/60 py-3 backdrop-blur-xl">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="text-sm">{running ? "Pause" : "Resume"}</span>
        </button>
      </div>
    </div>
  );
}

/* ============== TRIAGE ============== */

function TriageScreen({ contacts, onReply }: { contacts: Contact[]; onReply: () => void }) {
  const tiers: Tier[] = ["Inner Circle", "Collaborators", "Acquaintances"];
  const [tab, setTab] = useState<"Immediate" | "Delayed" | "Weakened">("Immediate");
  const filtered = contacts.filter(c => c.urgency === tab);
  const grouped = tiers.map(t => ({ tier: t, items: filtered.filter(c => c.tier === t) }));

  return (
    <Screen>
      <Header title="Triage" subtitle="RELATIONSHIP INTELLIGENCE" right={<Tag tone="warn">{contacts.length} tracked</Tag>} />

      <div className="mb-5 flex gap-2 rounded-full border border-border bg-surface/40 p-1 backdrop-blur-xl">
        {(["Immediate", "Delayed", "Weakened"] as const).map(u => (
          <button key={u} onClick={() => setTab(u)}
            className={`flex-1 rounded-full px-3 py-2 text-xs transition ${tab === u ? "bg-foreground text-background" : "text-muted"}`}>
            {u}<span className="ml-1 opacity-70">{contacts.filter(c => c.urgency === u).length}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {grouped.map(({ tier, items }) => (
          <div key={tier}>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">{tier}</div>
              <div className="h-px flex-1 mx-3 bg-border" />
              <div className="font-mono text-[10px] tabular-nums text-muted">{items.length}</div>
            </div>
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted">Silent tier.</div>
            ) : (
              <div className="space-y-2">
                {items.map(c => (
                  <TriageRow key={c.id} c={c} onReply={onReply} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function TriageRow({ c, onReply }: { c: Contact; onReply: () => void }) {
  const [replied, setReplied] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/40 p-3 backdrop-blur-xl">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: `oklch(0.7 0.1 ${c.hue})` }}>
        <span className="font-mono text-xs text-muted">{c.initials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium">{c.name}</div>
          <Tag tone={c.urgency === "Immediate" ? "danger" : c.urgency === "Delayed" ? "warn" : "muted"}>{c.urgency}</Tag>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted">{c.lastMessage}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="font-mono text-[10px] tabular-nums text-muted">{c.closeness.toFixed(1)}</div>
        <button onClick={() => { if (!replied) { setReplied(true); onReply(); } }}
          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${replied ? "border-ok/40 text-ok" : "border-border text-muted"}`}>
          {replied ? "sent" : "reply"}
        </button>
      </div>
    </div>
  );
}

/* ============== PLANNER ============== */

function PlannerScreen({ tasks, setTasks, focusMinutes }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>>; focusMinutes: number }) {
  const [draft, setDraft] = useState("");
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length > 0 ? done / tasks.length : 0;

  const toggle = (id: string) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const add = () => {
    if (!draft.trim()) return;
    setTasks(t => [...t, { id: `t${Date.now()}`, label: draft.trim(), done: false }]);
    setDraft("");
  };

  return (
    <Screen>
      <Header title="Planner" subtitle="AI PLANNER · TODAY" />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatRing label="Tasks" value={`${done}/${tasks.length}`} pct={pct} />
        <StatRing label="Focus hrs" value={(focusMinutes / 60).toFixed(1)} pct={Math.min(1, focusMinutes / 240)} />
        <StatRing label="Momentum" value={`${Math.round(pct * 100)}%`} pct={pct} />
      </div>

      <Card className="mb-4 p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">Today's list</div>
        <div className="space-y-2">
          {tasks.map(t => (
            <button key={t.id} onClick={() => toggle(t.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-3 text-left">
              <div className={`grid h-5 w-5 place-items-center rounded-md border transition ${t.done ? "border-accent bg-accent text-background" : "border-border"}`}>
                {t.done && <Check className="h-3 w-3" />}
              </div>
              <span className={`flex-1 text-sm ${t.done ? "text-muted line-through" : ""}`}>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Add a task…"
            className="flex-1 rounded-full border border-border bg-surface/40 px-4 py-2 text-sm outline-none" />
          <button onClick={add} className="rounded-full bg-foreground px-4 py-2 text-xs text-background">Add</button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Productivity statistics</div>
          <Tag tone="ok">live</Tag>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <StatLine label="Tasks finished" value={done} />
          <StatLine label="Hours disconnected" value={(focusMinutes / 60).toFixed(1)} />
          <StatLine label="Completion rate" value={`${Math.round(pct * 100)}%`} />
          <StatLine label="Streak" value="3 days" />
        </div>
      </Card>
    </Screen>
  );
}

function StatRing({ label, value, pct }: { label: string; value: string; pct: number }) {
  const c = 2 * Math.PI * 26;
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-surface/40 p-3 backdrop-blur-xl">
      <div className="relative h-16 w-16">
        <svg width={64} height={64} className="-rotate-90">
          <circle cx={32} cy={32} r={26} strokeWidth="2" stroke="var(--border)" fill="none" />
          <circle cx={32} cy={32} r={26} strokeWidth="2" stroke="var(--accent)" fill="none"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-xs font-medium">{value}</div>
      </div>
      <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted">{label}</div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface/40 px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-mono text-sm tabular-nums">{value}</span>
    </div>
  );
}

/* ============== BATTERY ============== */

function BatteryScreen({ value, triageReplies, tasksDone, focusMinutes }: { value: number; triageReplies: number; tasksDone: number; focusMinutes: number }) {
  const state = value > 60 ? "Restored" : value > 30 ? "Guarded" : "Depleted";
  const color = value > 60 ? "var(--ok)" : value > 30 ? "var(--warn)" : "var(--danger)";
  return (
    <Screen>
      <Header title="Social battery" subtitle="COGNITIVE ENERGY" />

      <div className="mb-6 flex justify-center">
        <div className="relative h-72 w-72">
          <div className="absolute inset-0 rounded-full border border-border noema-pulse" />
          <div className="absolute inset-6 rounded-full border border-border noema-pulse" style={{ animationDelay: "0.6s" }} />
          <div className="absolute inset-12 rounded-full noema-pulse" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: value / 200 + 0.2 }} />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">energy</div>
              <div className="mt-2 text-6xl font-light tabular-nums">{value}<span className="text-2xl text-muted">%</span></div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{state}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-4 p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">Signals feeding this reading</div>
        <div className="space-y-3">
          <Signal label="Intense triage replies" v={triageReplies} unit="drain" tone="danger" />
          <Signal label="Tasks completed" v={tasksDone} unit="recovery" tone="ok" />
          <Signal label="Focus minutes logged" v={focusMinutes} unit="recovery" tone="ok" />
          <Signal label="Emotional load" v={value < 40 ? "High" : value < 70 ? "Medium" : "Low"} unit="qualitative" tone="warn" />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Noema recommends</div>
        <p className="text-sm italic text-muted">"Consider stepping outside. A 20-minute walk typically restores 18% of your capacity."</p>
      </Card>
    </Screen>
  );
}

function Signal({ label, v, unit, tone }: { label: string; v: React.ReactNode; unit: string; tone: "ok" | "warn" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-2"><span className="font-mono text-sm tabular-nums">{v}</span><Tag tone={tone}>{unit}</Tag></div>
    </div>
  );
}

/* ============== BUBBLE ============== */

function BubbleScreen({ contacts }: { contacts: Contact[] }) {
  const [selected, setSelected] = useState<Contact | null>(null);
  // deterministic positions
  const positions = useMemo(() => contacts.map((_, i) => {
    const cols = 3;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const jitterX = ((i * 37) % 20) - 10;
    const jitterY = ((i * 53) % 20) - 10;
    return { left: `${15 + col * 30 + jitterX}%`, top: `${18 + row * 22 + jitterY}%` };
  }), [contacts]);

  return (
    <div className="relative h-full">
      <div className="px-5 pt-6">
        <Header title="Bubble" subtitle="SOCIAL FIELD" right={
          <button className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Circle className="h-3 w-3" />Legend
          </button>
        } />
      </div>

      <div className="relative mx-4 h-[560px] overflow-hidden rounded-3xl border border-border bg-surface/30 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        {contacts.map((c, i) => {
          const size = 44 + (c.closeness / 100) * 44;
          const color = `oklch(0.75 0.14 ${c.hue})`;
          return (
            <button key={c.id} onClick={() => setSelected(c)}
              className="absolute -translate-x-1/2 -translate-y-1/2 noema-drift"
              style={{ left: positions[i].left, top: positions[i].top, animationDelay: `${i * 0.7}s`, animationDuration: `${8 + i}s` }}>
              <div className="grid place-items-center rounded-full border-2 backdrop-blur-md transition hover:scale-110"
                style={{ width: size, height: size, borderColor: color, background: `oklch(0.75 0.08 ${c.hue} / 0.15)` }}>
                <span className="font-mono text-xs text-foreground/80">{c.initials}</span>
              </div>
            </button>
          );
        })}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between font-mono text-[9px] uppercase tracking-widest text-muted">
          <span>size = closeness</span><span>color = urgency</span>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-0 z-40 flex items-end bg-background/60 backdrop-blur-md" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full rounded-t-3xl border-t border-border bg-surface/95 p-6 backdrop-blur-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full border-2" style={{ borderColor: `oklch(0.75 0.14 ${selected.hue})` }}>
                <span className="font-mono text-sm">{selected.initials}</span>
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium">{selected.name}</div>
                <div className="flex items-center gap-2 pt-1"><Tag>{selected.tier}</Tag><Tag tone="warn">{selected.urgency}</Tag></div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full border border-border p-2 text-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <MetricCell label="Closeness" value={selected.closeness} suffix="/100" />
              <MetricCell label="Last seen" value={selected.lastSeen} />
              <MetricCell label="Health" value={healthScore(selected)} suffix="/A" />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-surface/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Connection health · Noema</div>
              <p className="mt-2 text-sm leading-relaxed text-muted italic">
                "{healthNote(selected)}"
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-foreground py-3 text-sm text-background">Draft a message</button>
              <button className="rounded-full border border-border px-4 py-3 text-sm text-muted">Snooze 24h</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function healthScore(c: Contact) {
  const s = Math.round(c.closeness);
  if (s > 80) return "A+";
  if (s > 65) return "A";
  if (s > 50) return "B";
  if (s > 35) return "C";
  return "D";
}
function healthNote(c: Contact) {
  if (c.urgency === "Immediate") return `${c.name.split(" ")[0]} is waiting on you. A short, warm reply tonight would repay the trust weight of this tier.`;
  if (c.urgency === "Weakened") return `You haven't touched this thread in a while. A low-effort ping now protects the long tail of this connection.`;
  return `The rhythm here is healthy. No action needed — I'll surface anything unusual.`;
}

function MetricCell({ label, value, suffix }: { label: string; value: React.ReactNode; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 text-lg font-medium">{value}<span className="text-xs text-muted">{suffix}</span></div>
    </div>
  );
}
