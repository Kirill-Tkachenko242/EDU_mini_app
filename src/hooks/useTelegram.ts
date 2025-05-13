import { useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function useTelegram() {
  // Получаем WebApp из глобального объекта Telegram
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      // Сообщаем приложению, что оно готово к отображению
      tg.ready();
      
      // Расширяем приложение на весь экран
      tg.expand();
      
      // Устанавливаем основной цвет
      tg.setHeaderColor('#2563eb');
    }
  }, [tg]);

  // Получаем информацию о пользователе
  const user: TelegramUser | undefined = tg?.initDataUnsafe?.user;

  // Закрыть Web App
  const close = () => {
    tg?.close();
  };

  // Отправить данные в бот
  const sendData = (data: any) => {
    tg?.sendData(JSON.stringify(data));
  };

  return {
    tg,
    user,
    close,
    sendData
  };
}