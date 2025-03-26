import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScheduleTabs } from '../components/ScheduleTabs';
import { FacultySchedule } from '../components/FacultySchedule';
import { TeacherSchedule } from '../components/TeacherSchedule';

export function SchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'faculty' | 'teachers'>('faculty');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Расписание</h1>
      </header>
      <main>
        <ScheduleTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'faculty' ? <FacultySchedule /> : <TeacherSchedule />}
      </main>
    </div>
  );
}