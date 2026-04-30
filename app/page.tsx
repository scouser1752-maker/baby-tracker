import { DashboardClient } from "@/components/DashboardClient";
import { getSupabaseClient } from "@/lib/supabase";
import type { Child, Feeding, Sleep } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = getSupabaseClient();

  const { data: children, error: childError } = await supabase
    .from("children")
    .select("*")
    .order("created_at")
    .limit(1);

  if (childError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-rose-300">
        Ошибка загрузки ребёнка: {childError.message}
      </main>
    );
  }

  const child = (children?.[0] ?? null) as Child | null;

  if (!child) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <div className="rounded-3xl border bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">Нет данных</h1>
          <p className="mt-3 text-slate-300">
            Добавьте ребёнка через Supabase SQL Editor. Пример есть в README и в
            supabase/schema.sql.
          </p>
        </div>
      </main>
    );
  }

  const [{ data: feedings, error: feedError }, { data: sleeps, error: sleepError }] =
    await Promise.all([
      supabase
        .from("feedings")
        .select("*")
        .eq("child_id", child.id)
        .order("started_at", { ascending: false })
        .limit(20),
      supabase
        .from("sleeps")
        .select("*")
        .eq("child_id", child.id)
        .order("started_at", { ascending: false })
        .limit(20),
    ]);

  if (feedError || sleepError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-rose-300">
        Ошибка загрузки событий: {(feedError ?? sleepError)?.message}
      </main>
    );
  }

 return (
  <DashboardClient
    child={child}
    initialFeedings={(feedings ?? []) as Feeding[]}
    initialSleeps={(sleeps ?? []) as Sleep[]}
  />
);
  
}