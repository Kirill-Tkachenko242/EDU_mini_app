import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Professor, Faculty } from '../../types/university';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface ProfessorFormProps {
  professorId?: string;
  onSuccess: () => void;
}

export function ProfessorForm({ professorId, onSuccess }: ProfessorFormProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [description, setDescription] = useState('');
  
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingFaculties, setLoadingFaculties] = useState(true);

  useEffect(() => {
    fetchFaculties();
    
    if (professorId) {
      setIsEditing(true);
      fetchProfessor(professorId);
    }
  }, [professorId]);

  const fetchFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setFaculties(data || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError('Не удалось загрузить список факультетов');
    } finally {
      setLoadingFaculties(false);
    }
  };

  const fetchProfessor = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setFullName(data.fullName || data.fullname || '');
        setPhoneNumber(data.phoneNumber || data.phonenumber || '');
        setEmail(data.email || '');
        setPosition(data.position || '');
        setFacultyId(data.faculty_id || '');
        setDescription(data.description || '');
      }
    } catch (err) {
      console.error('Error fetching professor:', err);
      setError('Не удалось загрузить данные преподавателя');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Введите ФИО преподавателя');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Введите номер телефона');
      return false;
    }
    if (!position.trim()) {
      setError('Введите должность');
      return false;
    }
    if (!facultyId) {
      setError('Выберите факультет');
      return false;
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email');
      return false;
    }
    
    // Validate phone number format
    const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    const professorData: Partial<Professor> = {
      fullName,
      phoneNumber,
      email: email || undefined,
      position,
      faculty_id: facultyId,
      description: description || undefined
    };

    try {
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('professors')
          .update(professorData)
          .eq('id', professorId);
      } else {
        result = await supabase
          .from('professors')
          .insert([professorData]);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFullName('');
        setPhoneNumber('');
        setEmail('');
        setPosition('');
        setFacultyId('');
        setDescription('');
      }
      
      // Notify parent component
      onSuccess();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving professor:', err);
      setError('Не удалось сохранить данные преподавателя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Редактирование преподавателя' : 'Добавление нового преподавателя'}
      </h2>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 flex items-start">
          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">
            {isEditing ? 'Данные преподавателя успешно обновлены' : 'Преподаватель успешно добавлен'}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            ФИО преподавателя*
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Иванов Иван Иванович"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1">
            Факультет*
          </label>
          {loadingFaculties ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Загрузка факультетов...</span>
            </div>
          ) : (
            <select
              id="faculty"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Выберите факультет</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Должность*
          </label>
          <input
            type="text"
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Профессор, д.т.н."
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Номер телефона*
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="+7 (900) 123-45-67"
          />
          <p className="mt-1 text-xs text-gray-500">Формат: +7 (XXX) XXX-XX-XX</p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="ivanov@university.edu"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Краткая биография, научные интересы, достижения..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Сохранение...' : 'Добавление...'}
            </span>
          ) : (
            isEditing ? 'Сохранить изменения' : 'Добавить преподавателя'
          )}
        </button>
      </form>
    </div>
  );
}