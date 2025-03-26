import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfessorsList } from '../components/contacts/ProfessorsList';

export function ContactsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Контакты преподавателей</h1>
      </header>
      <main className="p-4">
        <ProfessorsList />
      </main>
    </div>
  );
}