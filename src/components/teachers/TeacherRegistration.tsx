import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

interface TeacherRegistrationProps {
  onSuccess?: () => void;
}

export function TeacherRegistration({ onSuccess }: TeacherRegistrationProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Введите ФИО преподавателя');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email');
      return false;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    if (!phoneNumber.trim() || !/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(phoneNumber)) {
      setError('Введите корректный номер телефона в формате +7 (XXX) XXX-XX-XX');
      return false;
    }
    if (!department.trim()) {
      setError('Выберите кафедру');
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

    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'teacher',
            phone_number: phoneNumber,
            department
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create professor record
        const { error: profError } = await supabase
          .from('professors')
          .insert([{
            fullName,
            phoneNumber,
            email,
            department,
            position: 'Преподаватель'
          }]);

        if (profError) {
          throw profError;
        }

        toast.success('Преподаватель успешно зарегистрирован');
        onSuccess?.();

        // Reset form
        setFullName('');
        setEmail('');
        setPassword('');
        setPhoneNumber('');
        setDepartment('');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Ошибка при регистрации преподавателя. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Регистрация нового преподавателя</h2>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            ФИО*
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

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email*
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Пароль*
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Минимум 6 символов"
          />
        </div>

        <div>
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
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Кафедра*
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Выберите кафедру</option>
            <option value="Кафедра информационных технологий">Кафедра информационных технологий</option>
            <option value="Кафедра математики">Кафедра математики</option>
            <option value="Кафедра физики">Кафедра физики</option>
            <option value="Кафедра экономики">Кафедра экономики</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Регистрация...
            </>
          ) : (
            'Зарегистрировать'
          )}
        </button>
      </form>
    </div>
  );
}