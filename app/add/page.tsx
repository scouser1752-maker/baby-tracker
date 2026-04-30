"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

function getTodayDateTime() {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);

  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

export default function AddPage() {
  const router = useRouter();

  const [type, setType] = useState<"sleep" | "feeding">("sleep");
  const [start, setStart] = useState(getTodayDateTime());
  const [end, setEnd] = useState("");
  const [feedingType, setFeedingType] = useState<"breast" | "formula" | "pumped">("breast");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!start) {
      alert("Укажи время начала");
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseClient();

      const { data: child, error: childError } = await supabase
        .from("children")
        .select("id")
        .limit(1)
        .single();

      if (childError || !child) {
        throw new Error("Не удалось найти ребёнка");
      }

      if (type === "sleep") {
        const { error } = await supabase.from("sleeps").insert({
          child_id: child.id,
          started_at: new Date(start).toISOString(),
          ended_at: end ? new Date(end).toISOString() : null,
        });

        if (error) throw error;
      }

      if (type === "feeding") {
        const { error } = await supabase.from("feedings").insert({
          child_id: child.id,
          started_at: new Date(start).toISOString(),
          ended_at: end ? new Date(end).toISOString() : null,
          feeding_type: feedingType,
        });

        if (error) throw error;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <a href="/" className="text-sm text-emerald-400">
            ← На главную
          </a>

          <h1 className="mt-4 text-2xl font-bold">Добавить событие</h1>

          <p className="mt-2 text-sm text-slate-400">
            Используй эту форму, если не получилось нажать кнопку в моменте.
          </p>
        </header>

        <section className="rounded-2xl bg-slate-900 p-4 shadow-lg space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Тип события</span>

            <select
              className="w-full rounded-xl bg-slate-800 px-3 py-3 text-slate-100"
              value={type}
              onChange={(e) => setType(e.target.value as "sleep" | "feeding")}
            >
              <option value="sleep">Сон</option>
              <option value="feeding">Кормление</option>
            </select>
          </label>

          {type === "feeding" && (
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Тип кормления</span>

              <select
                className="w-full rounded-xl bg-slate-800 px-3 py-3 text-slate-100"
                value={feedingType}
                onChange={(e) =>
                  setFeedingType(e.target.value as "breast" | "formula" | "pumped")
                }
              >
                <option value="breast">Грудь</option>
                <option value="formula">Смесь</option>
                <option value="pumped">Сцеженное молоко</option>
              </select>
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Начало</span>

            <input
              className="w-full rounded-xl bg-slate-800 px-3 py-3 text-slate-100"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Окончание</span>

            <input
              className="w-full rounded-xl bg-slate-800 px-3 py-3 text-slate-100"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>

          <button
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
        </section>
      </div>
    </main>
  );
}