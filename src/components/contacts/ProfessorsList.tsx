import React, { useState, useEffect } from 'react';
import { Phone, Mail, Building, Award, Search, ExternalLink, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Professor, Faculty } from '../../types/university';
import { LoadingSpinner } from '../LoadingSpinner';

export function ProfessorsList() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [facultyMap, setFacultyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
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
        setError('Не удалось загрузить список преподавателей');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter professors based on search term and faculty filter
  const filteredProfessors = professors.filter(professor => {
    const matchesSearch = professor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (professor.email && professor.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFaculty = !facultyFilter || professor.faculty_id === facultyFilter;
    
    return matchesSearch && matchesFaculty;
  });

  // Group professors by faculty
  const professorsByFaculty: Record<string, Professor[]> = {};
  
  filteredProfessors.forEach(professor => {
    const facultyId = professor.faculty_id || 'unknown';
    if (!professorsByFaculty[facultyId]) {
      professorsByFaculty[facultyId] = [];
    }
    professorsByFaculty[facultyId].push(professor);
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

  if (professors.length === 0) {
    // Show mock data if no professors are found
    return <MockProfessorsList />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-4">
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
          Преподаватели не найдены. Попробуйте изменить параметры поиска.
        </div>
      ) : (
        Object.entries(professorsByFaculty).map(([facultyId, facultyProfessors]) => (
          <div key={facultyId} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-semibold">
                {facultyId !== 'unknown' ? facultyMap[facultyId] : 'Факультет не указан'}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {facultyProfessors.map((professor) => (
                <div key={professor.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
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
                        {professor.description && (
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Mock data component to show when no professors are in the database
function MockProfessorsList() {
  const mockDepartments = [
    {
      name: 'Кафедра информационных технологий',
      professors: [
        {
          id: '1',
          fullName: 'Иванов Иван Иванович',
          phoneNumber: '+79001234567',
          position: 'Профессор, д.т.н.',
          email: 'ivanov@university.edu'
        },
        {
          id: '2',
          fullName: 'Петрова Анна Сергеевна',
          phoneNumber: '+79009876543',
          position: 'Доцент, к.т.н.',
          email: 'petrova@university.edu'
        }
      ]
    },
    {
      name: 'Кафедра математики и статистики',
      professors: [
        {
          id: '3',
          fullName: 'Сидоров Михаил Александрович',
          phoneNumber: '+79005554433',
          position: 'Заведующий кафедрой, д.ф-м.н.',
          email: 'sidorov@university.edu'
        },
        {
          id: '4',
          fullName: 'Козлова Елена Владимировна',
          phoneNumber: '+79007778899',
          position: 'Старший преподаватель, к.ф-м.н.',
          email: 'kozlova@university.edu'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {mockDepartments.map((dept) => (
        <div key={dept.name} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">{dept.name}</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {dept.professors.map((professor) => (
              <div key={professor.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="text-lg font-medium text-gray-900">{professor.fullName}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      {professor.position}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}