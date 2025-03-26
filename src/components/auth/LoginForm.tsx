import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConnectionStatus } from '../../lib/supabase';
import { AlertCircle, Wifi, WifiOff, RefreshCw, Info } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [showCredentialsInfo, setShowCredentialsInfo] = useState(true); // Always show credentials
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Check connection status periodically
  useEffect(() => {
    // Initial check
    setIsOnline(getConnectionStatus());
    
    const checkOnlineStatus = () => {
      const status = getConnectionStatus();
      setIsOnline(status);
    };
    
    // Check immediately
    checkOnlineStatus();
    
    // Then check every 3 seconds
    const interval = setInterval(checkOnlineStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    setError('');
    
    // Force a new connection check
    const status = getConnectionStatus();
    setIsOnline(status);
    
    // Wait a bit to show the checking state
    setTimeout(() => {
      setIsCheckingConnection(false);
      if (!status) {
        setError('Соединение с сервером по-прежнему отсутствует. Проверьте ваше интернет-соединение.');
      }
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Force a connection check before proceeding
    const currentOnlineStatus = getConnectionStatus();
    setIsOnline(currentOnlineStatus);
    
    // Check connection status before attempting login
    if (!currentOnlineStatus) {
      setError('Нет подключения к серверу. Проверьте интернет-соединение и попробуйте снова.');
      return;
    }
    
    // Basic validation
    if (!email || !password) {
      setError('Пожалуйста, введите email и пароль');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const result = await signIn(email, password);
      
      if (result.error) {
        // Handle specific error types
        if (result.error.message.includes('Invalid login credentials') || 
            (result.error as any)?.code === 'invalid_credentials') {
          setError('Неверный email или пароль');
          // Show credentials info when login fails
          setShowCredentialsInfo(true);
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('Email не подтвержден. Пожалуйста, проверьте вашу почту');
        } else if (result.error.message.includes('retry') || 
                  result.error.message.includes('fetch') || 
                  result.error.message.includes('подключения')) {
          setError('Проблема с подключением к серверу. Пожалуйста, попробуйте позже');
          setIsOnline(false); // Update connection status
        } else {
          setError(result.error.message || 'Ошибка входа. Попробуйте позже.');
        }
        return;
      }
      
      // Successful login
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Или{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              зарегистрируйтесь, если у вас нет аккаунта
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
          
          {!isOnline && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isCheckingConnection ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Проверка соединения...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Проверить соединение
                  </>
                )}
              </button>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Demo credentials info box - always visible */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Тестовые учетные данные</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Для входа как администратор используйте:</p>
                  <div className="mt-1 font-mono bg-white p-2 rounded border border-blue-100 text-xs">
                    Email: admin@example.com<br />
                    Пароль: admin123
                  </div>
                </div>
              </div>
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
              {loading ? 'Вход...' : 'Войти'}
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