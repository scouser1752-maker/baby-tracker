"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Child, Feeding, Sleep } from "@/types";

type Period = "day" | "week" | "month";

function getPeriodStart(period: Period) {
  const now = new Date();

  if (period === "day") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getDaysCount(period: Period) {
  if (period === "day") return 1;
  if (period === "week") return 7;
  return 30;
}

function minutesBetween(start: string, end: string | null) {
  const started = new Date(start).getTime();
  const ended = end ? new Date(end).getTime() : Date.now();

  return Math.max(0, Math.round((ended - started) / 1000 / 60));
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function getAgeMonths(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const now = new Date();

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

function getSleepNorm(ageMonths: number | null) {
  if (ageMonths === null) return null;

  if (ageMonths <= 3) {
    return {
      min: 14,
      max: 17,
      label: "0–3 месяца",
    };
  }

  if (ageMonths <= 12) {
    return {
      min: 12,
      max: 16,
      label: "4–12 месяцев",
    };
  }

  if (ageMonths <= 24) {
    return {
      min: 11,
      max: 14,
      label: "1–2 года",
    };
  }

  return {
    min: 10,
    max: 13,
    label: "старше 2 лет",
  };
}

function getSleepAssessment(avgSleepHours: number, ageMonths: number | null) {
  const norm = getSleepNorm(ageMonths);

  if (!norm) {
    return {
      title: "Нет оценки",
      text: "Укажите дату рождения ребёнка в базе, чтобы считать ориентир по возрасту.",
      color: "text-slate-300",
    };
  }

  if (avgSleepHours < norm.min) {
    return {
      title: "Меньше ориентира",
      text: `Ориентир для возраста ${norm.label}: ${norm.min}–${norm.max} ч сна в сутки.`,
      color: "text-amber-300",
    };
  }

  if (avgSleepHours > norm.max) {
    return {
      title: "Выше ориентира",
      text: `Ориентир для возраста ${norm.label}: ${norm.min}–${norm.max} ч сна в сутки.`,
      color: "text-blue-300",
    };
  }

  return {
    title: "В пределах ориентира",
    text: `Ориентир для возраста ${norm.label}: ${norm.min}–${norm.max} ч сна в сутки.`,
    color: "text-emerald-300",
  };
}

function getAverageFeedingInterval(feedings: Feeding[]) {
  if (feedings.length < 2) return null;

  const sorted = [...feedings].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );

  const intervals: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].started_at).getTime();
    const current = new Date(sorted[i].started_at).getTime();

    intervals.push(Math.round((current - prev) / 1000 / 60));
  }

  const total = intervals.reduce((sum, item) => sum + item, 0);
  return Math.round(total / intervals.length);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("day");
  const [child, setChild] = useState<Child | null>(null);
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorText("");

      try {
        const supabase = getSupabaseClient();

        const { data: childData, error: childError } = await supabase
          .from("children")
          .select("*")
          .limit(1)
          .single();

        if (childError || !childData) {
          throw new Error("Не удалось загрузить ребёнка");
        }

        const start = getPeriodStart(period).toISOString();
        const end = new Date().toISOString();

        const { data: sleepsData, error: sleepsError } = await supabase
          .from("sleeps")
          .select("*")
          .eq("child_id", childData.id)
          .gte("started_at", start)
          .lte("started_at", end)
          .order("started_at", { ascending: false });

        if (sleepsError) throw sleepsError;

        const { data: feedingsData, error: feedingsError } = await supabase
          .from("feedings")
          .select("*")
          .eq("child_id", childData.id)
          .gte("started_at", start)
          .lte("started_at", end)
          .order("started_at", { ascending: false });

        if (feedingsError) throw feedingsError;

        setChild(childData);
        setSleeps(sleepsData ?? []);
        setFeedings(feedingsData ?? []);
      } catch (error) {
        console.error(error);
        setErrorText("Не удалось загрузить аналитику");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [period]);

  const stats = useMemo(() => {
    const daysCount = getDaysCount(period);

    const totalSleepMinutes = sleeps.reduce((sum, sleep) => {
      return sum + minutesBetween(sleep.started_at, sleep.ended_at);
    }, 0);

    const completedSleeps = sleeps.filter((sleep) => sleep.ended_at);
    const avgSleepPerDayMinutes = Math.round(totalSleepMinutes / daysCount);

    const totalFeedingMinutes = feedings.reduce((sum, feeding) => {
      return sum + minutesBetween(feeding.started_at, feeding.ended_at);
    }, 0);

    const completedFeedings = feedings.filter((feeding) => feeding.ended_at);

    const avgFeedingMinutes =
      completedFeedings.length > 0
        ? Math.round(totalFeedingMinutes / completedFeedings.length)
        : 0;

    const avgFeedingInterval = getAverageFeedingInterval(feedings);

    const ageMonths = getAgeMonths(child?.birth_date ?? null);
    const assessment = getSleepAssessment(avgSleepPerDayMinutes / 60, ageMonths);

    return {
      totalSleepMinutes,
      avgSleepPerDayMinutes,
      sleepsCount: sleeps.length,
      completedSleepsCount: completedSleeps.length,
      feedingsCount: feedings.length,
      completedFeedingsCount: completedFeedings.length,
      avgFeedingMinutes,
      avgFeedingInterval,
      ageMonths,
      assessment,
    };
  }, [sleeps, feedings, child, period]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <a href="/" className="text-sm text-emerald-400">
              ← На главную
            </a>

            <h1 className="mt-4 text-2xl font-bold">Аналитика</h1>

            <p className="mt-2 text-sm text-slate-400">
              Сон и кормления за выбранный период.
            </p>
          </div>

          <a
            href="/add"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            Добавить
          </a>
        </header>

        <section className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-900 p-2">
          <button
            className={`rounded-xl px-3 py-3 text-sm font-semibold ${
              period === "day"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300"
            }`}
            onClick={() => setPeriod("day")}
          >
            День
          </button>

          <button
            className={`rounded-xl px-3 py-3 text-sm font-semibold ${
              period === "week"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300"
            }`}
            onClick={() => setPeriod("week")}
          >
            Неделя
          </button>

          <button
            className={`rounded-xl px-3 py-3 text-sm font-semibold ${
              period === "month"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300"
            }`}
            onClick={() => setPeriod("month")}
          >
            Месяц
          </button>
        </section>

        {loading && (
          <div className="rounded-2xl bg-slate-900 p-4 text-slate-400">
            Загружаю аналитику...
          </div>
        )}

        {errorText && (
          <div className="rounded-2xl bg-red-950 p-4 text-red-200">
            {errorText}
          </div>
        )}

        {!loading && !errorText && (
          <>
            <section className="rounded-2xl bg-slate-900 p-4 shadow-lg">
              <p className="text-sm text-slate-400">Оценка сна</p>

              <h2 className={`mt-2 text-2xl font-bold ${stats.assessment.color}`}>
                {stats.assessment.title}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {stats.assessment.text}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Средний сон в сутки:{" "}
                <span className="text-slate-200">
                  {formatMinutes(stats.avgSleepPerDayMinutes)}
                </span>
              </p>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
                <p className="text-sm text-slate-400">Всего сна</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatMinutes(stats.totalSleepMinutes)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
                <p className="text-sm text-slate-400">Количество снов</p>
                <p className="mt-2 text-2xl font-bold">{stats.sleepsCount}</p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
                <p className="text-sm text-slate-400">Кормлений</p>
                <p className="mt-2 text-2xl font-bold">{stats.feedingsCount}</p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
                <p className="text-sm text-slate-400">
                  Средний интервал между кормлениями
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {stats.avgFeedingInterval
                    ? formatMinutes(stats.avgFeedingInterval)
                    : "Недостаточно данных"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-900 p-4 shadow-lg">
              <h2 className="text-lg font-bold">Детали периода</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">Завершённых снов</span>
                  <span>{stats.completedSleepsCount}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">Завершённых кормлений</span>
                  <span>{stats.completedFeedingsCount}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">Средняя длительность кормления</span>
                  <span>{formatMinutes(stats.avgFeedingMinutes)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Возраст ребёнка</span>
                  <span>
                    {stats.ageMonths === null
                      ? "Не указан"
                      : `${stats.ageMonths} мес.`}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}