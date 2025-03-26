import { useEffect } from 'react';

export function useTelegram() {
  const tg = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    close: () => {},
    sendData: () => {},
    initDataUnsafe: {}
  };

  useEffect(() => {
    // Инициализация Telegram Mini App
    tg.ready();
    
    // Автоматически расширяем приложение при загрузке
    tg.expand();
  }, []);

  const onClose = () => {
    tg.close();
  };

  const sendData = (data: any) => {
    tg.sendData(JSON.stringify(data));
  };

  return {
    tg,
    user: tg.initDataUnsafe?.user,
    onClose,
    sendData,
  };
}