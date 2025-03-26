import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarHeaderProps {
  view: 'week' | 'month';
  onViewChange: (view: 'week' | 'month') => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarHeader({ view, onViewChange, currentDate, onDateChange }: CalendarHeaderProps) {
  const dateFormatter = new Intl.DateTimeFormat('ru', {
    month: 'long',
    year: 'numeric',
    ...(view === 'week' && { day: 'numeric' }),
  });

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewChange('week')}
          className={`px-3 py-1 rounded ${
            view === 'week' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
        >
          Неделя
        </button>
        <button
          onClick={() => onViewChange('month')}
          className={`px-3 py-1 rounded ${
            view === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
        >
          Месяц
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handlePrevious} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">{dateFormatter.format(currentDate)}</span>
        </div>
        <button onClick={handleNext} className="p-1">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}