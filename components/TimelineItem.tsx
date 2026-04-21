import { formatDateTime, durationLabel } from '@/lib/time';
import type { TimelineEvent } from '@/types';

export function TimelineItem({ event }: { event: TimelineEvent }) {
  if (event.kind === 'feeding') {
    return (
      <div className="rounded-3xl border bg-slate-900/70 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Кормление</p>
            <p className="text-sm text-slate-400">{formatDateTime(event.data.started_at)}</p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>{event.data.feeding_type}</p>
            <p>{durationLabel(event.data.started_at, event.data.ended_at)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Сон</p>
          <p className="text-sm text-slate-400">{formatDateTime(event.data.started_at)}</p>
        </div>
        <div className="text-right text-sm text-slate-300">
          <p>{event.data.ended_at ? 'Завершён' : 'Спит сейчас'}</p>
          <p>{durationLabel(event.data.started_at, event.data.ended_at)}</p>
        </div>
      </div>
    </div>
  );
}
