import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Mail, Building, Award, Search, ExternalLink, User, Edit, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Professor, Faculty } from '../../types/university';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export function ProfessorsList() {
  // Состояние компонента
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [facultyMap, setFacultyMap] = useState<Record<string, string>>({});
  const [editingProfessor, setEditingProfessor] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    phoneNumber: '',
    email: '',
    description: ''
  });

  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
  }, []);

  // Функция загрузки данных из базы
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Загружаем факультеты и преподавателей параллельно
      const [facultiesResponse, professorsResponse] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('professors').select('*').order('fullName')
      ]);

      if (facultiesResponse.error) throw facultiesResponse.error;
      if (professorsResponse.error) throw professorsResponse.error;

      // Создаем карту факультетов для быстрого доступа
      const facultyMapData: Record<string, string> = {};
      facultiesResponse.data?.forEach(faculty => {
        facultyMapData[faculty.id] = faculty.name;
      });

      setFaculties(facultiesResponse.data || []);
      setFacultyMap(facultyMapData);
      setProfessors(professorsResponse.data || []);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить список преподавателей');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик редактирования профиля
  const handleEdit = (professor: Professor) => {
    if (professor.email !== profile?.email) return;
    
    setEditingProfessor(professor.id);
    setEditForm({
      phoneNumber: professor.phoneNumber,
      email: professor.email || '',
      description: professor.description || ''
    });
  };

  // Сохранение изменений профиля
  const handleSave = async () => {
    try {
      const { error: updateError } = await supabase
        .from('professors')
        .update({
          phoneNumber: editForm.phoneNumber,
          email: editForm.email || null,
          description: editForm.description || null
        })
        .eq('id', editingProfessor)
        .eq('email', profile?.email);

      if (updateError) throw updateError;

      toast.success('Контактная информация обновлена');
      fetchData();
      setEditingProfessor(null);
    } catch (err) {
      console.error('Ошибка обновления данных:', err);
      toast.error('Не удалось обновить информацию');
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    setEditingProfessor(null);
    setEditForm({
      phoneNumber: '',
      email: '',
      description: ''
    });
  };

  // Мемоизированная фильтрация преподавателей
  const filteredProfessors = useMemo(() => {
    return professors.filter(professor => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        professor.fullName.toLowerCase().includes(searchLower) ||
        (professor.email?.toLowerCase().includes(searchLower) || false);
      
      const matchesFaculty = !facultyFilter || professor.faculty_id === facultyFilter;
      
      return matchesSearch && matchesFaculty;
    });
  }, [professors, searchTerm, facultyFilter]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Панель поиска и фильтрации */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Поиск по ФИО или email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Поиск..."
              />
            </div>
          </div>
          
          <div className="md:w-1/3">
            <label htmlFor="faculty-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Фильтр по факультету
            </label>
            <select
              id="faculty-filter"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все факультеты</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Список преподавателей */}
      {filteredProfessors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Преподаватели не найдены. Попробуйте изменить параметры поиска.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredProfessors.map((professor) => (
              <div key={professor.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  {/* Информация о преподавателе */}
                  <div className="mb-4 sm:mb-0 flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      {professor.photo_url ? (
                        <img 
                          className="h-16 w-16 rounded-full object-cover" 
                          src={professor.photo_url} 
                          alt={professor.fullName} 
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{professor.fullName}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Award className="w-4 h-4 mr-1" />
                        {professor.position}
                      </p>
                      {professor.description && editingProfessor !== professor.id && (
                        <p className="text-sm text-gray-600 mt-2 max-w-lg">
                          {professor.description}
                        </p>
                      )}
                      {professor.personal_page_url && (
                        <a 
                          href={professor.personal_page_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Личная страница
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Форма редактирования */}
                  {editingProfessor === professor.id ? (
                    <div className="space-y-4 w-full sm:w-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Телефон
                        </label>
                        <input
                          type="tel"
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="+7 (XXX) XXX-XX-XX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          О себе
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancel}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Контактная информация */
                    <div className="flex flex-col space-y-2">
                      <a
                        href={`tel:${professor.phoneNumber}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        {professor.phoneNumber}
                      </a>
                      {professor.email && (
                        <a
                          href={`mailto:${professor.email}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          {professor.email}
                        </a>
                      )}
                      {isTeacher && professor.email === profile?.email && (
                        <button
                          onClick={() => handleEdit(professor)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}