import React from 'react';
import { getMonthDays } from '../../utils/dateUtils';
import { ScheduleEvent } from '../../types/schedule';
import { Edit, Trash2 } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  isEditing?: boolean;
  onEditEvent?: (event: ScheduleEvent) => void;
  onDeleteEvent?: (id: string) => void;
}

export function MonthView({ 
  currentDate, 
  events,
  isEditing = false,
  onEditEvent,
  onDeleteEvent
}: MonthViewProps) {
  const monthDays = getMonthDays(currentDate);
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="grid grid-cols-7 border-t border-l">
      {weekDays.map((day) => (
        <div key={day} className="p-2 text-center border-r border-b font-medium">
          {day}
        </div>
      ))}
      {monthDays.map((date, index) => (
        <div
          key={index}
          className="min-h-[100px] p-2 border-r border-b relative"
        >
          <div className="text-sm text-gray-500">{date.getDate()}</div>
          <div className="space-y-1">
            {events
              .filter((event) => {
                const eventDate = new Date(event.date);
                return (
                  eventDate.getDate() === date.getDate() &&
                  eventDate.getMonth() === date.getMonth()
                );
              })
              .map((event, eventIndex) => (
                <div
                  key={eventIndex}
                  className="text-xs p-1 bg-blue-100 rounded relative group"
                >
                  <div className="font-medium truncate">{event.subject}</div>
                  <div className="text-gray-600 flex justify-between">
                    <span>
                      {new Date(event.date).getHours()}:
                      {new Date(event.date).getMinutes().toString().padStart(2, '0')}
                    </span>
                    <span>{event.room}</span>
                  </div>
                  
                  {isEditing && (
                    <div className="absolute top-0 right-0 hidden group-hover:flex bg-white rounded shadow-sm">
                      <button
                        onClick={() => onEditEvent && onEditEvent(event)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent && event.id && onDeleteEvent(event.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}