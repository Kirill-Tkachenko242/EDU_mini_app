import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Professor, Faculty } from '../../types/university';
import { Edit, Trash2, Search, User, Building, Phone, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

interface ProfessorsListProps {
  onEdit: (id: string) => void;
}

export function AdminProfessorsList({ onEdit }: ProfessorsListProps) {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [facultyMap, setFacultyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch faculties
      const { data: facultiesData, error: facultiesError } = await supabase
        .from('faculties')
        .select('*')
        .order('name', { ascending: true });

      if (facultiesError) {
        throw facultiesError;
      }

      setFaculties(facultiesData || []);
      
      // Create a map of faculty IDs to names
      const facultyMapData: Record<string, string> = {};
      facultiesData?.forEach(faculty => {
        facultyMapData[faculty.id] = faculty.name;
      });
      setFacultyMap(facultyMapData);

      // Fetch professors
      const { data: professorsData, error: professorsError } = await supabase
        .from('professors')
        .select('*')
        .order('fullName', { ascending: true });

      if (professorsError) {
        throw professorsError;
      }

      setProfessors(professorsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого преподавателя?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      
      const { error } = await supabase
        .from('professors')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update the list after deletion
      setProfessors(professors.filter(professor => professor.id !== id));
    } catch (err) {
      console.error('Error deleting professor:', err);
      alert('Не удалось удалить преподавателя');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filter professors based on search term and faculty filter
  const filteredProfessors = professors.filter(professor => {
    const matchesSearch = professor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (professor.email && professor.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFaculty = !facultyFilter || professor.faculty_id === facultyFilter;
    
    return matchesSearch && matchesFaculty;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Поиск по ФИО или email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
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

      {filteredProfessors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          {searchTerm || facultyFilter ? 
            'Преподаватели не найдены. Попробуйте изменить параметры поиска.' : 
            'Список преподавателей пуст. Добавьте нового преподавателя.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ФИО
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Факультет
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Должность
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакты
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfessors.map((professor) => (
                  <tr key={professor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {professor.photo_url ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={professor.photo_url} 
                              alt={professor.fullName} 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{professor.fullName}</div>
                          {professor.personal_page_url && (
                            <a 
                              href={professor.personal_page_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Личная страница
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building className="h-4 w-4 mr-1 text-gray-500" />
                        {professor.faculty_id ? facultyMap[professor.faculty_id] : 'Не указан'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{professor.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-500" />
                        {professor.phoneNumber}
                      </div>
                      {professor.email && (
                        <div className="text-sm text-gray-900 flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-1 text-gray-500" />
                          {professor.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit(professor.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(professor.id)}
                        disabled={deleteLoading === professor.id}
                        className={`text-red-600 hover:text-red-900 ${deleteLoading === professor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {deleteLoading === professor.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}