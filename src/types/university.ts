export interface Professor {
  id: string;
  fullName: string;
  phoneNumber: string;
  department?: string;
  position: string;
  email?: string;
  faculty_id?: string;
  photo_url?: string;
  description?: string;
  personal_page_url?: string;
}

export interface Faculty {
  id: string;
  name: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  category: 'event' | 'academic' | 'campus' | 'achievement' | 'other';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  year: number;
  type: 'award' | 'certificate' | 'competition' | 'ranking';
  imageUrl?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Statistics {
  totalStudents: number;
  totalProfessors: number;
  totalAwards: number;
  internationalRanking: number;
  foundationYear: number;
}