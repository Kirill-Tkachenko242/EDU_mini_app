import React from 'react';

interface TabProps {
  activeTab: 'faculty' | 'teachers';
  onTabChange: (tab: 'faculty' | 'teachers') => void;
}

export function ScheduleTabs({ activeTab, onTabChange }: TabProps) {
  return (
    <div className="flex border-b">
      <button
        className={`px-4 py-2 ${
          activeTab === 'faculty'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-600'
        }`}
        onClick={() => onTabChange('faculty')}
      >
        Факультеты
      </button>
      <button
        className={`px-4 py-2 ${
          activeTab === 'teachers'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-600'
        }`}
        onClick={() => onTabChange('teachers')}
      >
        Преподаватели
      </button>
    </div>
  );
}