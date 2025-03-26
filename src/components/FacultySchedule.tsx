import React, { useState, useEffect } from 'react';
import { ScheduleCalendar } from './calendar/ScheduleCalendar';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';

interface Faculty {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  faculty_id: string;
}

export function FacultySchedule() {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFaculties() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('faculties')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setFaculties(data || []);
      } catch (err) {
        console.error('Error fetching faculties:', err);
        setError('Не удалось загрузить список факультетов');
      } finally {
        setLoading(false);
      }
    }

    fetchFaculties();
  }, []);

  // Используем моковые группы, так как в базе данных их может не быть
  const mockGroups = [
    { id: '1', name: 'А-2107', faculty_id: '' },
    { id: '2', name: 'А-2207', faculty_id: '' },
    { id: '3', name: 'А-2307', faculty_id: '' },
    { id: '4', name: 'ИТ-2108', faculty_id: '' },
    { id: '5', name: 'ИТ-2208', faculty_id: '' },
    { id: '6', name: 'ИТ-2308', faculty_id: '' },
    { id: '7', name: 'РМ-2109', faculty_id: '' },
    { id: '8', name: 'РМ-2209', faculty_id: '' },
    { id: '9', name: 'РМ-2309', faculty_id: '' },
  ];

  // Если нет факультетов в базе данных, используем моковые данные
  const displayFaculties = faculties.length > 0 ? faculties : [
    { id: '1', name: 'Автоматика и вычислительная техника' },
    { id: '2', name: 'Информационные технологии' },
    { id: '3', name: 'Робототехника и мехатроника' },
  ];

  // Фильтруем группы по выбранному факультету
  const currentGroups = selectedFaculty 
    ? mockGroups.filter((g, index) => index % 3 === displayFaculties.findIndex(f => f.name === selectedFaculty) % 3)
    : [];

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

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 mb-6">
        <select
          value={selectedFaculty}
          onChange={(e) => {
            setSelectedFaculty(e.target.value);
            setSelectedGroup('');
          }}
          className="p-2 border rounded-md"
        >
          <option value="">Выберите факультет...</option>
          {displayFaculties.map((faculty) => (
            <option key={faculty.id} value={faculty.name}>
              {faculty.name}
            </option>
          ))}
        </select>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="p-2 border rounded-md"
          disabled={!selectedFaculty}
        >
          <option value="">Выберите группу...</option>
          {currentGroups.map((group) => (
            <option key={group.id} value={group.name}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {selectedFaculty && selectedGroup && <ScheduleCalendar />}
    </div>
  );
}