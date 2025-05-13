import React from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MaterialsList } from '../components/materials/MaterialsList';
import { MaterialUpload } from '../components/materials/MaterialUpload';
import { useAuth } from '../contexts/AuthContext';

export function MaterialsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showUpload, setShowUpload] = React.useState(false);
  
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Справочные материалы</h1>
          </div>
          
          {isTeacher && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center px-3 py-1 bg-white text-blue-600 rounded-md hover:bg-blue-50"
            >
              <Upload className="w-4 h-4 mr-1" />
              {showUpload ? 'Скрыть форму' : 'Загрузить'}
            </button>
          )}
        </div>
      </header>
      
      <main className="p-4 space-y-6">
        {showUpload && (
          <MaterialUpload onSuccess={() => setShowUpload(false)} />
        )}
        <MaterialsList />
      </main>
    </div>
  );
}