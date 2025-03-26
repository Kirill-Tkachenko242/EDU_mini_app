import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessorForm } from './ProfessorForm';
import { AdminProfessorsList } from './ProfessorsList';
import { NewsForm } from './NewsForm';
import { AdminNewsList } from './AdminNewsList';
import { AchievementForm } from './AchievementForm';
import { AdminAchievementsList } from './AdminAchievementsList';
import { StatisticsForm } from './StatisticsForm';
import { FAQForm } from './FAQForm';
import { AdminFAQList } from './AdminFAQList';
import { Users, Newspaper, Award, BarChart2, HelpCircle, Plus, X } from 'lucide-react';

export function AdminPanel() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('professors');
  const [showForm, setShowForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | undefined>(undefined);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              У вас нет доступа к панели администратора. Эта функция доступна только для администраторов.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowForm(false);
    setEditItemId(undefined);
  };

  const handleAddNew = () => {
    setShowForm(true);
    setEditItemId(undefined);
  };

  const handleEdit = (id: string) => {
    setEditItemId(id);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    // You would typically refresh the data here
    // For now, we'll just close the form
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-bold">Панель администратора</h2>
      </div>
      
      <div className="flex border-b overflow-x-auto">
        <button
          onClick={() => handleTabChange('professors')}
          className={`px-4 py-3 flex items-center whitespace-nowrap ${
            activeTab === 'professors'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Преподаватели
        </button>
        <button
          onClick={() => handleTabChange('news')}
          className={`px-4 py-3 flex items-center whitespace-nowrap ${
            activeTab === 'news'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Newspaper className="w-4 h-4 mr-2" />
          Новости
        </button>
        <button
          onClick={() => handleTabChange('achievements')}
          className={`px-4 py-3 flex items-center whitespace-nowrap ${
            activeTab === 'achievements'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Award className="w-4 h-4 mr-2" />
          Достижения
        </button>
        <button
          onClick={() => handleTabChange('statistics')}
          className={`px-4 py-3 flex items-center whitespace-nowrap ${
            activeTab === 'statistics'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 mr-2" />
          Статистика
        </button>
        <button
          onClick={() => handleTabChange('faq')}
          className={`px-4 py-3 flex items-center whitespace-nowrap ${
            activeTab === 'faq'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          FAQ
        </button>
      </div>
      
      <div className="p-4">
        {!showForm && activeTab !== 'statistics' && (
          <button
            onClick={handleAddNew}
            className="mb-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'professors' && 'Добавить преподавателя'}
            {activeTab === 'news' && 'Добавить новость'}
            {activeTab === 'achievements' && 'Добавить достижение'}
            {activeTab === 'faq' && 'Добавить FAQ'}
          </button>
        )}
        
        {showForm ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {activeTab === 'professors' && (editItemId ? 'Редактирование преподавателя' : 'Новый преподаватель')}
                {activeTab === 'news' && (editItemId ? 'Редактирование новости' : 'Новая новость')}
                {activeTab === 'achievements' && (editItemId ? 'Редактирование достижения' : 'Новое достижение')}
                {activeTab === 'faq' && (editItemId ? 'Редактирование FAQ' : 'Новый FAQ')}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {activeTab === 'professors' && (
              <ProfessorForm 
                professorId={editItemId} 
                onSuccess={handleFormSuccess} 
              />
            )}
            
            {activeTab === 'news' && (
              <NewsForm 
                newsId={editItemId} 
                onSuccess={handleFormSuccess} 
              />
            )}
            
            {activeTab === 'achievements' && (
              <AchievementForm 
                achievementId={editItemId} 
                onSuccess={handleFormSuccess} 
              />
            )}
            
            {activeTab === 'faq' && (
              <FAQForm 
                faqId={editItemId} 
                onSuccess={handleFormSuccess} 
              />
            )}
          </div>
        ) : (
          <div>
            {activeTab === 'professors' && <AdminProfessorsList onEdit={handleEdit} />}
            {activeTab === 'news' && <AdminNewsList onEdit={handleEdit} />}
            {activeTab === 'achievements' && <AdminAchievementsList onEdit={handleEdit} />}
            {activeTab === 'statistics' && <StatisticsForm onSuccess={() => {}} />}
            {activeTab === 'faq' && <AdminFAQList onEdit={handleEdit} />}
          </div>
        )}
      </div>
    </div>
  );
}