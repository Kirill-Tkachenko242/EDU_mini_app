import React from 'react';
import { MainMenu } from '../components/MainMenu';
import { useTelegram } from '../hooks/useTelegram';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const { user } = useTelegram();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Принудительно перенаправляем на страницу входа
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Если произошла ошибка, все равно пытаемся перенаправить
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  // Получаем имя пользователя из разных источников, приоритет отдаем данным профиля
  const userName = profile?.full_name || 
                  (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 
                  localStorage.getItem('user_full_name') || 'Пользователь');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Образовательный портал</h1>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className={`flex items-center px-3 py-1 ${isLoggingOut ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-400'} rounded-md text-sm`}
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                Выход...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-1" />
                Выйти
              </>
            )}
          </button>
        </div>
        
        <div className="mt-1">
          <p className="text-sm">
            Добро пожаловать, {userName}
          </p>
        </div>
      </header>
      <main>
        <MainMenu />
      </main>
    </div>
  );
}