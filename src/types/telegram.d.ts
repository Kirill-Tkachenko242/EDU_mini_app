interface TelegramWebApps {
  WebApp: {
    ready(): void;
    expand(): void;
    close(): void;
    sendData(data: any): void;
    initDataUnsafe: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
      };
      start_param?: string;
    };
  };
}

declare global {
  interface Window {
    Telegram: TelegramWebApps;
  }
}