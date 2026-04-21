export type FeedingType = 'breast' | 'formula' | 'pumped';

export type Child = {
  id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
};

export type Feeding = {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  feeding_type: FeedingType;
  side: 'left' | 'right' | 'both' | null;
  volume_ml: number | null;
  notes: string | null;
  created_at: string;
};

export type Sleep = {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
};

export type TimelineEvent =
  | { kind: 'feeding'; data: Feeding }
  | { kind: 'sleep'; data: Sleep };
