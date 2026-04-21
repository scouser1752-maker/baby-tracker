export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function diffLabel(from: string, to = new Date().toISOString()) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} мин`;
  return `${hours} ч ${minutes} мин`;
}

export function durationLabel(start: string, end?: string | null) {
  return diffLabel(start, end ?? new Date().toISOString());
}

export function startOfTodayIso() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
}
