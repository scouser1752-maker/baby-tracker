'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ActionButton';
import { Card } from '@/components/Card';
import { TimelineItem } from '@/components/TimelineItem';
import { buildTimeline } from '@/lib/dashboard';
import { diffLabel, durationLabel } from '@/lib/time';
import { getSupabaseClient } from '@/lib/supabase';
import type { Child, Feeding, Sleep } from '@/types';

const supabase = getSupabaseClient();

export function DashboardClient({
  child,
  initialFeedings,
  initialSleeps,
}: {
  child: Child;
  initialFeedings: Feeding[];
  initialSleeps: Sleep[];
}) {
  const [feedings, setFeedings] = useState(initialFeedings);
  const [sleeps, setSleeps] = useState(initialSleeps);
  const [error, setError] = useState<string | null>(null);

  const activeFeeding = useMemo(() => feedings.find((item) => !item.ended_at) ?? null, [feedings]);
  const activeSleep = useMemo(() => sleeps.find((item) => !item.ended_at) ?? null, [sleeps]);
  const lastCompletedFeeding = useMemo(
    () => feedings.find((item) => item.ended_at) ?? null,
    [feedings],
  );
  const lastWake = useMemo(
    () => sleeps.find((item) => item.ended_at)?.ended_at ?? null,
    [sleeps],
  );

  const timeline = useMemo(() => buildTimeline(feedings, sleeps).slice(0, 8), [feedings, sleeps]);

  async function reload() {
    const [{ data: feedData, error: feedError }, { data: sleepData, error: sleepError }] = await Promise.all([
      supabase.from('feedings').select('*').eq('child_id', child.id).order('started_at', { ascending: false }).limit(20),
      supabase.from('sleeps').select('*').eq('child_id', child.id).order('started_at', { ascending: false }).limit(20),
    ]);

    if (feedError || sleepError) {
      throw feedError ?? sleepError;
    }

    setFeedings((feedData ?? []) as Feeding[]);
    setSleeps((sleepData ?? []) as Sleep[]);
  }

  async function startFeeding() {
    setError(null);
    const { error } = await supabase.from('feedings').insert({
      child_id: child.id,
      feeding_type: 'breast',
      started_at: new Date().toISOString(),
    });
    if (error) return setError(error.message);
    await reload();
  }

  async function stopFeeding() {
    if (!activeFeeding) return;
    setError(null);
    const { error } = await supabase
      .from('feedings')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', activeFeeding.id);
    if (error) return setError(error.message);
    await reload();
  }

  async function startSleep() {
    setError(null);
    const { error } = await supabase.from('sleeps').insert({
      child_id: child.id,
      started_at: new Date().toISOString(),
    });
    if (error) return setError(error.message);
    await reload();
  }

  async function stopSleep() {
    if (!activeSleep) return;
    setError(null);
    const { error } = await supabase
      .from('sleeps')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', activeSleep.id);
    if (error) return setError(error.message);
    await reload();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Baby tracker</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{child.name}</h1>
          <p className="mt-2 text-sm text-slate-400">Минимальный семейный трекер кормлений и сна</p>
        </div>
        <a href="/history" className="rounded-full border px-4 py-2 text-sm text-slate-200">
          История
        </a>
      </header>

      {error ? <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <Card
          title="Последнее кормление"
          value={lastCompletedFeeding?.ended_at ? `${diffLabel(lastCompletedFeeding.ended_at)} назад` : 'Пока нет'}
          subtitle={lastCompletedFeeding ? `Длилось ${durationLabel(lastCompletedFeeding.started_at, lastCompletedFeeding.ended_at)}` : 'Сделайте первую запись'}
        />
        <Card
          title="Последнее пробуждение"
          value={lastWake ? `${diffLabel(lastWake)} назад` : 'Пока нет'}
          subtitle={activeSleep ? `Сейчас спит уже ${durationLabel(activeSleep.started_at)}` : 'Сейчас бодрствует'}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {activeFeeding ? (
          <ActionButton variant="danger" onClick={stopFeeding}>Завершить кормление</ActionButton>
        ) : (
          <ActionButton onClick={startFeeding}>Начать кормление</ActionButton>
        )}

        {activeSleep ? (
          <ActionButton variant="danger" onClick={stopSleep}>Проснулся</ActionButton>
        ) : (
          <ActionButton variant="secondary" onClick={startSleep}>Уложили спать</ActionButton>
        )}
      </section>

      <section className="rounded-3xl border bg-slate-900/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Последние события</h2>
          <a className="text-sm text-emerald-400" href="/history">
            Вся история
          </a>
        </div>
        <div className="mt-4 space-y-3">
          {timeline.length ? timeline.map((event) => <TimelineItem key={`${event.kind}-${event.data.id}`} event={event} />) : <p className="text-sm text-slate-400">Пока нет событий.</p>}
        </div>
      </section>
    </div>
  );
}
