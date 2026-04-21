import { TimelineItem } from '@/components/TimelineItem';
import { buildTimeline } from '@/lib/dashboard';
import { getSupabaseClient } from '@/lib/supabase';
import { startOfTodayIso } from '@/lib/time';
import type { Child, Feeding, Sleep } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const supabase = getSupabaseClient();
  const { data: children } = await supabase.from('children').select('*').order('created_at').limit(1);
  const child = (children?.[0] ?? null) as Child | null;

  if (!child) {
    return <main className="p-6">Сначала создайте запись ребёнка.</main>;
  }

  const today = startOfTodayIso();
  const [{ data: feedings }, { data: sleeps }] = await Promise.all([
    supabase
      .from('feedings')
      .select('*')
      .eq('child_id', child.id)
      .gte('started_at', today)
      .order('started_at', { ascending: false }),
    supabase
      .from('sleeps')
      .select('*')
      .eq('child_id', child.id)
      .gte('started_at', today)
      .order('started_at', { ascending: false }),
  ]);

  const timeline = buildTimeline((feedings ?? []) as Feeding[], (sleeps ?? []) as Sleep[]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">История</p>
          <h1 className="mt-2 text-3xl font-semibold">События за сегодня</h1>
        </div>
        <a href="/" className="rounded-full border px-4 py-2 text-sm text-slate-200">
          На главную
        </a>
      </div>

      <div className="space-y-3">
        {timeline.length ? timeline.map((event) => <TimelineItem key={`${event.kind}-${event.data.id}`} event={event} />) : <p className="text-slate-400">За сегодня пока нет записей.</p>}
      </div>
    </main>
  );
}
