import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { AuthApiError } from '@supabase/supabase-js';


export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [faculties, setFaculties] = useState<Array<{ id: string; name: string }>>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (facultyId) {
      fetchGroups(facultyId);
    }
  }, [facultyId]);

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase
        .from('faculties')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setFaculties(data || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const fetchGroups = async (facultyId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('faculty_id', facultyId)
        .order('name');
      
      if (error) throw error;
      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      setError('Нет подключения к серверу. Проверьте интернет-соединение и попробуйте снова.');
      return;
    }
    
    if (!email || !password || !fullName) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (role === 'student' && !groupId) {
      setError('Выберите группу');
      return;
    }

    if (role === 'teacher' && !facultyId) {
      setError('Для преподавателя необходимо указать факультет');
      return;
    }
    
    try {
      setError('');
      setLoading(true);

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            phone_number: phoneNumber || undefined,
            faculty_id: facultyId || undefined
          },
        },
      });

      if (authError) {
        console.error('supabase.auth.signUp error:', authError);
        if ((authError as AuthApiError).status) {
          console.log('status:', (authError as AuthApiError).status);
        }
        setError(
          authError.message.includes('user_already_exists')
          ? 'Этот email уже зарегистрирован. Пожалуйста, войдите в систему или используйте другой email адрес.'
          : authError.message
        );
          return;
        throw authError;
      }

      if (authData.user) {
        // If registering as a student, add to selected group
        if (role === 'student' && groupId) {
          const { error: groupError } = await supabase
            .from('student_groups')
            .insert([{
              student_id: authData.user.id,
              group_id: groupId
            }]);

          if (groupError) throw groupError;
        }

        // If registering as a teacher, create teacher request
        if (role === 'teacher') {
          const { error: requestError } = await supabase
            .from('teacher_requests')
            .insert([{
              user_id: authData.user.id,
              full_name: fullName,
              email: email,
              motivation: 'Регистрация нового преподавателя',
              status: 'pending'
            }]);

          if (requestError) throw requestError;

          const { error: profError } = await supabase
            .from('professors')
            .insert([{
              id: authData.user.id,
              fullName,
              email,
              phoneNumber: phoneNumber || '',
              position: 'Преподаватель',
              faculty_id: facultyId
            }]);
          if (profError) throw profError;
          await supabase.auth.signOut();
        }

        alert('Регистрация успешна! Теперь вы можете войти в систему.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Регистрация
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Войдите
            </Link>
          </p>
          
          <div className="mt-2 flex justify-center">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 mr-1" />
                  <span>Подключено к серверу</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span>Нет подключения к серверу</span>
                </>
              )}
            </div>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Полное имя"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                minLength={8}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Пароль (минимум 8 символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="student">Студент</option>
                <option value="teacher">Преподаватель</option>
              </select>
            </div>

            <div>
              <input
                type="tel"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Номер телефона"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {role === 'student' ? (
              <>
                <div>
                  <select
                    value={facultyId}
                    onChange={(e) => {
                      setFacultyId(e.target.value);
                      setGroupId('');
                    }}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  >
                    <option value="">Выберите факультет...</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    disabled={!facultyId}
                  >
                    <option value="">Выберите группу...</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                >
                  <option value="">Выберите факультет...</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isOnline}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || !isOnline 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
          
          {!isOnline && (
            <div className="text-center text-sm text-gray-500">
              Проверьте подключение к интернету и обновите страницу
            </div>
          )}
        </form>
      </div>
    </div>
  );
}