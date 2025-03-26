import React, { useState, useEffect } from 'react';
import { ScheduleCalendar } from './calendar/ScheduleCalendar';
import { supabase } from '../lib/supabase';
import { Professor } from '../types/university';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export function TeacherSchedule() {
  const { profile } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [teachers, setTeachers] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    // If the current user is a teacher, set them as the selected teacher
    if (isTeacher) {
      setSelectedTeacher(profile?.id || '');
      setLoading(false);
    } else {
      fetchTeachers();
    }
  }, [profile]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('fullName', { ascending: true });

      if (error) {
        throw error;
      }

      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Не удалось загрузить список преподавателей');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  // If the current user is a teacher, show their schedule directly
  if (isTeacher) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Ваше расписание</h2>
        <ScheduleCalendar teacherId={profile?.id} />
      </div>
    );
  }

  // Если нет преподавателей в базе данных, используем моковые данные
  const displayTeachers = teachers.length > 0 ? teachers : [
    { id: '1', fullName: 'Иванов Петр Михайлович', phoneNumber: '+79001234567', position: 'Профессор' },
    { id: '2', fullName: 'Петрова Анна Сергеевна', phoneNumber: '+79009876543', position: 'Доцент' },
    { id: '3', fullName: 'Сидоров Михаил Александрович', phoneNumber: '+79005554433', position: 'Заведующий кафедрой' },
    { id: '4', fullName: 'Козлова Елена Владимировна', phoneNumber: '+79007778899', position: 'Старший преподаватель' },
  ];

  return (
    <div className="p-4">
      <select
        value={selectedTeacher}
        onChange={(e) => setSelectedTeacher(e.target.value)}
        className="w-full p-2 border rounded-md mb-6"
      >
        <option value="">Выберите преподавателя...</option>
        {displayTeachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.fullName}
          </option>
        ))}
      </select>

      {selectedTeacher && <ScheduleCalendar teacherId={selectedTeacher} />}
    </div>
  );
}