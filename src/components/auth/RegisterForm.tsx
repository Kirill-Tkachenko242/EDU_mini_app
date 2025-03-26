import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, getConnectionStatus } from '../../lib/supabase';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const navigate = useNavigate();

  // Check connection status periodically
  useEffect(() => {
    setIsOnline(getConnectionStatus());
    
    const checkOnlineStatus = () => {
      const status = getConnectionStatus();
      setIsOnline(status);
    };
    
    const interval = setInterval(checkOnlineStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check connection status before attempting registration
    if (!isOnline) {
      setError(' Нет подключения к серверу. Проверьте интернет-соединение и попробуйте снова.');
      return;
    }
    
    // Basic validation
    if (!email || !password || !fullName) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    try {
      setError('');
      setLoading(true);

      // Store the full name in localStorage as a backup
      localStorage.setItem('user_full_name', fullName);

      // Check if user already exists using auth API instead of profiles table
      const { data: { users }, error: checkError } = await supabase.auth.admin.listUsers({
        filters: {
          email: email
        }
      }).catch(() => {
        // If admin API is not available, we'll proceed with registration
        // and let the server handle duplicate emails
        return { data: { users: [] }, error: null };
      });
        
      if (checkError) {
        console.error('Error checking existing user:', checkError);
      } else if (users && users.length > 0) {
        setError('Этот email уже зарегистрирован');
        setLoading(false);
        return;
      }

      // Proceed with registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (authError) {
        console.error('Auth error during registration:', authError);
        
        if (authError.message?.includes('network') || authError.message?.includes('fetch')) {
          setError('Проблема с подключением к серверу. Проверьте интернет-соединение.');
        } else if (authError.message?.includes('already registered') || authError.message?.includes('already exists') || authError.message?.includes('User already registered')) {
          setError('Этот email уже зарегистрирован');
        } else if (authError.message?.includes('Database error') || authError.code === 'unexpected_failure') {
          // Handle the specific error we're seeing
          setError('Ошибка при создании пользователя. Пожалуйста, попробуйте другой email или обратитесь к администратору.');
        } else {
          setError(authError.message || 'Ошибка регистрации. Попробуйте позже.');
        }
        return;
      }

      if (authData?.user) {
        // Don't try to create a profile manually - the database trigger will handle this
        // Just show success message and redirect to login
        alert('Регистрация успешна! Теперь вы можете войти в систему.');
        navigate('/login');
      } else {
        // This shouldn't happen if there's no error, but just in case
        setError('Неизвестная ошибка при регистрации. Пожалуйста, попробуйте позже.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Ошибка регистрации. Попробуйте позже.');
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
          
          {/* Connection status indicator */}
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
                minLength={6}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Пароль (минимум 6 символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="student">Студент</option>
                <option value="teacher">Преподаватель</option>
              </select>
            </div>
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