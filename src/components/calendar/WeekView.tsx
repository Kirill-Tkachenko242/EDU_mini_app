import React from 'react';
import { getWeekDays } from '../../utils/dateUtils';
import { ScheduleEvent } from '../../types/schedule';
import { Edit, Trash2 } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  events: ScheduleEvent[];
  isEditing?: boolean;
  onEditEvent?: (event: ScheduleEvent) => void;
  onDeleteEvent?: (id: string) => void;
}

export function WeekView({ 
  currentDate, 
  events, 
  isEditing = false,
  onEditEvent,
  onDeleteEvent
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);
  const timeSlots = Array.from({ length: 8 }, (_, i) => i + 8); // 8:00 - 15:00

  return (
    <div className="overflow-auto">
      <div className="grid grid-cols-8 border-b">
        <div className="w-20" /> {/* Empty cell for time column */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="p-2 text-center border-l"
          >
            <div className="font-medium">
              {new Intl.DateTimeFormat('ru', { weekday: 'short' }).format(day)}
            </div>
            <div className="text-sm text-gray-500">
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="relative">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b">
            <div className="w-20 p-2 text-right text-sm text-gray-500">
              {`${hour}:00`}
            </div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="border-l min-h-[60px]">
                {events
                  .filter((event) => {
                    const eventDate = new Date(event.date);
                    return (
                      eventDate.getDate() === day.getDate() &&
                      eventDate.getMonth() === day.getMonth() &&
                      eventDate.getHours() === hour
                    );
                  })
                  .map((event, index) => (
                    <div
                      key={index}
                      className="m-1 p-1 text-xs bg-blue-100 rounded relative group"
                    >
                      <div className="font-medium">{event.subject}</div>
                      <div className="flex justify-between">
                        <span>{event.room}</span>
                        {event.group && <span className="text-gray-600">{event.group}</span>}
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
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}