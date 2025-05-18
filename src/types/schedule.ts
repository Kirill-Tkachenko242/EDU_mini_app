export interface ScheduleEvent {
  id?: string;
  date: string;
  subject: string;
  room: string;
  teacher?: string;
  teacher_id?: string;
  group?: string;
  group_id?: string;
  duration?: string;
  recurring?: boolean;
  recurrence_pattern?: 'weekly' | 'biweekly' | 'monthly';
}

export interface ScheduleConflict {
  id: string;
  event1_id: string;
  event2_id: string;
  conflict_type: 'time_overlap' | 'room_conflict' | 'teacher_conflict';
  created_at: string;
}