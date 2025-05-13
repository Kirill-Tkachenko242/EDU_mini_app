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
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingFaculties, setLoadingFaculties] = useState(true);
  const [currentProfessorEmail, setCurrentProfessorEmail] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

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
        setFullName(data.fullName || '');
        setPhoneNumber(data.phoneNumber || '');
        setEmail(data.email || '');
        setCurrentProfessorEmail(data.email || '');
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      setCheckingEmail(true);
      const normalizedEmail = email.trim().toLowerCase();
      
      // Skip check if editing and email hasn't changed
      if (isEditing && normalizedEmail === currentProfessorEmail?.toLowerCase()) {
        return false;
      }

      const { data, error } = await supabase
        .from('professors')
        .select('email')
        .ilike('email', normalizedEmail)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error('Error checking email:', err);
      throw new Error('Не удалось проверить уникальность email');
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateForm = async () => {
    try {
      setError('');
      setEmailError('');

      if (!fullName.trim()) {
        setError('Введите ФИО преподавателя');
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

      const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setError('Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX');
        return false;
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setEmailError('Email обязателен для заполнения');
        return false;
      }

      if (!validateEmail(trimmedEmail)) {
        setEmailError('Введите корректный email адрес');
        return false;
      }

      // Check if email exists
      const emailExists = await checkEmailExists(trimmedEmail);
      if (emailExists) {
        setEmailError('Преподаватель с таким email уже существует');
        return false;
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      setLoading(true);
      setError('');
      setSuccess(false);

      const normalizedEmail = email.trim().toLowerCase();

      const professorData = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: normalizedEmail,
        position: position.trim(),
        faculty_id: facultyId,
        description: description.trim() || null
      };
      
      if (isEditing && professorId) {
        const { error: updError } = await supabase
          .from('professors')
          .update(professorData)
          .eq('id', professorId);

        if (updError?.code === '23505') {
          setEmailError('Преподаватель с таким email уже существует');
          return;
        }
        if (updError) throw updError;
      } else {
        const { data: newId, error: rpcError } = await supabase
          .rpc<{ new_id: string }>(
            'insert_professor_if_email_unique',
            { professor_data: professorData }
          );

        if (rpcError?.code === '23505') {
          setEmailError('Преподаватель с таким email уже существует');
          return;
        }
        if (rpcError) throw rpcError;
        // newId — UUID вставленного преподавателя
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
      
      onSuccess();
      
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
      
      <form onSubmit={handleSubmit} autoComplete="off">
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
            autoComplete="off"
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
            autoComplete="off"
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
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500">Формат: +7 (XXX) XXX-XX-XX</p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email*
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(''); // Clear error when email changes
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                emailError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ivanov@university.edu"
              autoComplete="off"
              disabled={checkingEmail} // Disable input while checking email
            />
            {checkingEmail && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
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
            autoComplete="off"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || checkingEmail}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading || checkingEmail ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading || checkingEmail ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {checkingEmail ? 'Проверка email...' : isEditing ? 'Сохранение...' : 'Добавление...'}
            </span>
          ) : (
            isEditing ? 'Сохранить изменения' : 'Добавить преподавателя'
          )}
        </button>
      </form>
    </div>
  );
}