import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GradesTable } from '../components/GradesTable';
import { useTelegram } from '../hooks/useTelegram';
import { useAuth } from '../contexts/AuthContext';

export function GradesPage() {
  const navigate = useNavigate();
  const { sendData } = useTelegram();
  const { profile } = useAuth();

  const isTeacher = profile?.role === 'teacher';
  const isStudent = profile?.role === 'student';

  const handleShareGrades = () => {
    sendData({ action: 'share_grades', class: '10А' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Успеваемость</h1>
      </header>
      <main className="p-4">
        {isStudent && (
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Ваши оценки</h2>
            <button
              onClick={handleShareGrades}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
            >
              Поделиться
            </button>
          </div>
        )}
        
        {isTeacher && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Управление оценками студентов</h2>
            <p className="text-sm text-gray-600 mt-1">
              Выберите студента из списка ниже, чтобы просмотреть и редактировать его оценки.
            </p>
          </div>
        )}
        
        <GradesTable />
      </main>
    </div>
  );
}