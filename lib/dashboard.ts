import type { Feeding, Sleep, TimelineEvent } from '@/types';

export function buildTimeline(feedings: Feeding[], sleeps: Sleep[]): TimelineEvent[] {
  return [
    ...feedings.map((data) => ({ kind: 'feeding' as const, data })),
    ...sleeps.map((data) => ({ kind: 'sleep' as const, data })),
  ].sort((a, b) => {
    const aTime = new Date(a.data.started_at).getTime();
    const bTime = new Date(b.data.started_at).getTime();
    return bTime - aTime;
  });
}
