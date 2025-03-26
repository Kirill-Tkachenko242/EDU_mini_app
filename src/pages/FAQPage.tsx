import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AchievementsList } from '../components/achievements/AchievementsList';
import { AdminPanel } from '../components/admin/AdminPanel';
import { useAuth } from '../contexts/AuthContext';

export function FAQPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">FAQ и достижения</h1>
      </header>
      <main className="p-4">
        {isAdmin && (
          <div className="mb-6">
            <AdminPanel />
          </div>
        )}
        <AchievementsList />
      </main>
    </div>
  );
}