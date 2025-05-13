export interface Material {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: 'public' | 'restricted';
  allowedGroups: string[];
  backupUrl?: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export const DEFAULT_CATEGORIES: MaterialCategory[] = [
  { id: 'lectures', name: 'Лекции', icon: 'BookOpen' },
  { id: 'practice', name: 'Практические занятия', icon: 'PenTool' },
  { id: 'assignments', name: 'Задания', icon: 'FileText' },
  { id: 'exams', name: 'Экзамены', icon: 'GraduationCap' },
  { id: 'other', name: 'Прочее', icon: 'File' }
];

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB