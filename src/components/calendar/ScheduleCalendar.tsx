import React, { useState, useEffect } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { ScheduleEvent } from '../../types/schedule';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../LoadingSpinner';
import { Plus, Edit, Save, X, AlertCircle } from 'lucide-react';

export function ScheduleCalendar({ teacherId = '', groupId = '' }: { teacherId?: string, groupId?: string }) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  
  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchEvents();
  }, [teacherId, groupId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      let query = supabase.from('schedule_events').select('*');
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      
      if (groupId) {
        query = query.eq('group_id', groupId);
      }
      
      const { data, error: queryError } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      if (data) {
        // Map class_group to group for compatibility with our components
        const mappedData = data.map(event => ({
          ...event,
          group: event.class_group,
          // Ensure date is properly formatted
          date: new Date(event.date).toISOString()
        }));
        setEvents(mappedData);
      } else {
        // Use mock data if no events found
        setEvents(getMockEvents());
      }
    } catch (err) {
      console.error('Error fetching schedule events:', err);
      setError('Не удалось загрузить расписание');
      // Fallback to mock data on error
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent({
      id: '',
      date: new Date().toISOString(),
      subject: '',
      room: '',
      teacher: profile?.full_name || '',
      teacher_id: profile?.id || '',
      group: '',
      group_id: groupId || ''
    });
    setShowEventForm(true);
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    
    try {
      setLoading(true);
      
      const eventData = {
        date: editingEvent.date,
        subject: editingEvent.subject,
        room: editingEvent.room,
        teacher: editingEvent.teacher,
        teacher_id: editingEvent.teacher_id || profile?.id,
        class_group: editingEvent.group, // Use class_group field for database
        group_id: editingEvent.group_id || groupId
      };
      
      let result;
      
      if (editingEvent.id) {
        // Update existing event
        result = await supabase
          .from('schedule_events')
          .update(eventData)
          .eq('id', editingEvent.id);
      } else {
        // Create new event
        result = await supabase
          .from('schedule_events')
          .insert([eventData]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Refresh events
      fetchEvents();
      setShowEventForm(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Не удалось сохранить событие в расписании');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Refresh events
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Не удалось удалить событие из расписания');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
        
        {isTeacher && (
          <div className="flex items-center">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1 rounded-md mr-2 ${
                isEditing ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Edit className="w-4 h-4" />
            </button>
            
            {isEditing && (
              <button
                onClick={handleAddEvent}
                className="px-3 py-1 bg-green-600 text-white rounded-md flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </button>
            )}
          </div>
        )}
      </div>
      
      {view === 'week' ? (
        <WeekView 
          currentDate={currentDate} 
          events={events} 
          isEditing={isEditing}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      ) : (
        <MonthView 
          currentDate={currentDate} 
          events={events} 
          isEditing={isEditing}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
      
      {showEventForm && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingEvent.id ? 'Редактировать занятие' : 'Добавить занятие'}
              </h2>
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Предмет
                </label>
                <input
                  type="text"
                  value={editingEvent.subject}
                  onChange={(e) => setEditingEvent({...editingEvent, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата и время
                </label>
                <input
                  type="datetime-local"
                  value={new Date(editingEvent.date).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingEvent({...editingEvent, date: new Date(e.target.value).toISOString()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Аудитория
                </label>
                <input
                  type="text"
                  value={editingEvent.room}
                  onChange={(e) => setEditingEvent({...editingEvent, room: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Группа
                </label>
                <input
                  type="text"
                  value={editingEvent.group}
                  onChange={(e) => setEditingEvent({...editingEvent, group: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md mr-2"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for demonstration
function getMockEvents(): ScheduleEvent[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  return [
    {
      id: '1',
      date: tomorrow.toISOString(),
      subject: 'Математический анализ',
      room: '301',
      teacher: 'Иванов П.М.',
      teacher_id: '',
      group: 'ИТ-2108',
      group_id: ''
    },
    {
      id: '2',
      date: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
      subject: 'Программирование',
      room: '405',
      teacher: 'Петрова А.С.',
      teacher_id: '',
      group: 'ИТ-2108',
      group_id: ''
    },
    {
      id: '3',
      date: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
      subject: 'Физика',
      room: '201',
      teacher: 'Сидоров М.А.',
      teacher_id: '',
      group: 'ИТ-2108',
      group_id: ''
    },
  ];
}