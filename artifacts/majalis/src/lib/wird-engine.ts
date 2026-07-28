/**
 * محرّك الورد اليومي الذكي — أهداف صفحات/أحزاب/دقائق، سلسلة، تذكيرات محلية.
 * الحسابات والتذكيرات خارج الخيط الرئيسي قدر الإمكان (setTimeout / idle).
 */
import {
  getDailyWirdState,
  saveDailyWirdState,
  prevDateStr,
  type DailyWirdState,
} from "@/lib/quran-api";
import { getActiveKhatmahPlanId, listKhatmahWithMeta } from "@/lib/khatmah-sync";
import { yieldToMain } from "@/lib/yield-to-main";

export type WirdGoalType = "pages" | "hizb" | "minutes";

export type WirdGoalConfig = {
  type: WirdGoalType;
  /** صفحات يوميًا (pages) أو أحزاب (hizb) أو دقائق (minutes) */
  target: number;
  reminderEnabled: boolean;
  /** ساعة محلية 0–23 */
  reminderHour: number;
  reminderMinute: number;
};

const GOAL_KEY = "mj-wird-goal-v1";
const NOTIF_FLAG = "mj-wird-notif-last-v1";

const DEFAULT_GOAL: WirdGoalConfig = {
  type: "pages",
  target: 2,
  reminderEnabled: false,
  reminderHour: 21,
  reminderMinute: 0,
};

export function getWirdGoal(): WirdGoalConfig {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (raw) return { ...DEFAULT_GOAL, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_GOAL };
}

export function saveWirdGoal(goal: Partial<WirdGoalConfig>): WirdGoalConfig {
  const next = { ...getWirdGoal(), ...goal };
  try { localStorage.setItem(GOAL_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** تطبيع تاريخ الورد عند تغيّر اليوم — بلا حجب. */
export function refreshWirdDayBoundary(state = getDailyWirdState()): DailyWirdState {
  const today = todayKey();
  if (state.lastDate === today) return state;
  const next: DailyWirdState = {
    ...state,
    completedToday: 0,
    lastDate: today,
    weeklyLogs: { ...state.weeklyLogs },
  };
  saveDailyWirdState(next);
  return next;
}

/**
 * تسجيل تقدّم الورد (صفحات مقروءة و/أو دقائق).
 * يُستدعى من قلب الصفحة بعد الانتقال — خفيف ومتزامن.
 */
export function recordWirdProgress(opts: {
  pages?: number;
  minutes?: number;
  surah?: number;
  ayah?: number;
}): DailyWirdState {
  const goal = getWirdGoal();
  let state = refreshWirdDayBoundary();
  const pages = Math.max(0, opts.pages ?? 0);
  const minutes = Math.max(0, opts.minutes ?? 0);

  let units = pages;
  if (goal.type === "hizb") {
    units = pages / 10;
  } else if (goal.type === "minutes") {
    units = minutes;
  }

  const prevCompleted = state.completedToday;
  const completedToday = prevCompleted + units;
  const weeklyLogs = { ...state.weeklyLogs };
  const today = todayKey();
  weeklyLogs[today] = (weeklyLogs[today] ?? 0) + (goal.type === "minutes" ? minutes : pages);

  let streak = state.streak;
  const justDone = completedToday >= goal.target && prevCompleted < goal.target;
  if (justDone) {
    const yesterday = prevDateStr(today);
    const yesterdayLog = weeklyLogs[yesterday] ?? 0;
    const yesterdayDone =
      goal.type === "pages"
        ? yesterdayLog >= goal.target
        : goal.type === "hizb"
          ? yesterdayLog / 10 >= goal.target
          : yesterdayLog >= goal.target;
    streak = yesterdayDone ? state.streak + 1 : Math.max(1, state.streak || 1);
  }

  state = {
    ...state,
    pagesPerDay: goal.type === "pages" ? goal.target : state.pagesPerDay,
    completedToday,
    monthlyTotal: state.monthlyTotal + pages,
    totalPagesEver: state.totalPagesEver + pages,
    weeklyLogs,
    lastDate: today,
    currentSurah: opts.surah ?? state.currentSurah,
    currentAyah: opts.ayah ?? state.currentAyah,
    streak,
  };
  saveDailyWirdState(state);
  return state;
}

export function getWirdProgressSnapshot(): {
  goal: WirdGoalConfig;
  state: DailyWirdState;
  pct: number;
  displayDone: number;
  displayTarget: number;
  unitLabel: string;
  streakLabel: string;
  khatmahEtaDays: number | null;
} {
  const goal = getWirdGoal();
  const state = refreshWirdDayBoundary();
  const displayTarget = Math.max(0.1, goal.target);
  const displayDone = state.completedToday;
  const pct = Math.min(1, displayDone / displayTarget);
  const unitLabel =
    goal.type === "hizb" ? "حزب" : goal.type === "minutes" ? "دقيقة" : "صفحة";
  const streakLabel =
    state.streak >= 1 ? `${state.streak} ${state.streak === 1 ? "يوم" : "أيام"} متواصلة` : "ابدأ سلسلتك اليوم";

  let khatmahEtaDays: number | null = null;
  const plans = listKhatmahWithMeta();
  const activeId = getActiveKhatmahPlanId();
  const active = plans.find((p) => p.id === activeId) ?? plans[0];
  if (active && !active.completedAt) {
    const remaining = Math.max(0, 604 - active.totalPagesRead);
    const dailyPace =
      goal.type === "pages"
        ? Math.max(0.5, goal.target)
        : goal.type === "hizb"
          ? Math.max(1, goal.target * 10)
          : Math.max(1, goal.target / 3); // دقائق ≈ ثلث صفحة تقريبي
    khatmahEtaDays = Math.ceil(remaining / dailyPace);
  }

  return { goal, state, pct, displayDone, displayTarget, unitLabel, streakLabel, khatmahEtaDays };
}

let reminderTimer: number | null = null;

function msUntilReminder(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

async function fireWirdNotification(): Promise<void> {
  const today = todayKey();
  try {
    if (localStorage.getItem(NOTIF_FLAG) === today) return;
  } catch { /* ignore */ }

  const snap = getWirdProgressSnapshot();
  if (snap.pct >= 1) return;

  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification("وردك اليومي من القرآن", {
      body: `بقي ${Math.max(0, +(snap.displayTarget - snap.displayDone).toFixed(1))} ${snap.unitLabel} لإكمال ورد اليوم. ${snap.streakLabel}`,
      tag: "majalis-wird-daily",
      dir: "rtl",
      lang: "ar",
      silent: false,
    });
    localStorage.setItem(NOTIF_FLAG, today);
  } catch { /* ignore */ }
}

/** جدولة تذكير الورد — لا يحجب الواجهة. */
export function scheduleWirdReminder(): void {
  if (reminderTimer != null) {
    window.clearTimeout(reminderTimer);
    reminderTimer = null;
  }
  const goal = getWirdGoal();
  if (!goal.reminderEnabled) return;
  if (typeof Notification === "undefined") return;

  const delay = msUntilReminder(goal.reminderHour, goal.reminderMinute);
  reminderTimer = window.setTimeout(() => {
    void (async () => {
      await yieldToMain();
      await fireWirdNotification();
      scheduleWirdReminder(); // اليوم التالي
    })();
  }, Math.min(delay, 2_147_000_000));
}

export async function enableWirdNotifications(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  let perm = Notification.permission;
  if (perm === "default") {
    perm = await Notification.requestPermission();
  }
  if (perm !== "granted") return false;
  saveWirdGoal({ reminderEnabled: true });
  scheduleWirdReminder();
  return true;
}

export function disableWirdNotifications(): void {
  saveWirdGoal({ reminderEnabled: false });
  if (reminderTimer != null) {
    window.clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}
