export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  grades: number[];
  created_at: string;
  updated_at: string;
}

export interface GradeHistory {
  id: string;
  student_id: string;
  subject: string;
  value: number;
  type: 'test' | 'assignment' | 'participation';
  comment?: string;
  created_at: string;
  created_by?: string;
}

export interface GradeInput {
  student_id: string;
  subject: string;
  value: number;
  type: 'test' | 'assignment' | 'participation';
  comment?: string;
}