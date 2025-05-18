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
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // 1) Загрузить список факультетов
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('faculties')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setFaculties(data || []);
      } catch (err: any) {
        console.error('Error fetching faculties:', err);
        setError('Не удалось загрузить список факультетов');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) При изменении selectedFaculty — загрузить группы
  useEffect(() => {
    if (!selectedFaculty) {
      setGroups([]);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('groups')
          .select('id, name, faculty_id')
          .eq('faculty_id', selectedFaculty)
          .order('name', { ascending: true });

        if (error) throw error;
        setGroups(data || []);
      } catch (err: any) {
        console.error('Error fetching groups:', err);
        setError('Не удалось загрузить список групп');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedFaculty]);

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner />
      </div>
    );
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
        {/* Выбор факультета */}
        <select
          value={selectedFaculty}
          onChange={(e) => {
            setSelectedFaculty(e.target.value);
            setSelectedGroup('');
          }}
          className="p-2 border rounded-md"
        >
          <option value="">Выберите факультет...</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>

        {/* Выбор группы */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          disabled={!selectedFaculty}
          className="p-2 border rounded-md"
        >
          <option value="">Выберите группу...</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Показываем календарь, когда выбраны и факультет, и группа */}
      {selectedFaculty && selectedGroup && (
        <ScheduleCalendar
          facultyId={selectedFaculty}
          groupId={selectedGroup}
        />
      )}
    </div>
  );
}
