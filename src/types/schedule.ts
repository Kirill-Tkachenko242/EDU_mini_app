export interface ScheduleEvent {
  id?: string;
  date: string;
  subject: string;
  room: string;
  teacher?: string;
  teacher_id?: string;
  group?: string;
  group_id?: string;
}