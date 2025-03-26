import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { getConnectionStatus } from '../lib/supabase';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(getConnectionStatus());
    };
    
    // Check immediately
    checkOnlineStatus();
    
    // Then check every 3 seconds
    const interval = setInterval(checkOnlineStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsChecking(true);
    
    // Force a connection check
    getConnectionStatus();
    
    // Wait a bit to show the checking state
    setTimeout(() => {
      setIsOnline(getConnectionStatus());
      setIsChecking(false);
      
      // If we're back online, refresh the page
      if (getConnectionStatus()) {
        window.location.reload();
      }
    }, 1500);
  };

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-4 py-3 rounded-lg shadow-md">
      <div className="flex items-center mb-2">
        <WifiOff className="w-5 h-5 mr-2" />
        <span className="font-medium">Нет подключения к серверу</span>
      </div>
      <button 
        onClick={handleRefresh}
        disabled={isChecking}
        className="w-full flex items-center justify-center px-3 py-1.5 bg-white text-red-800 rounded border border-red-300 text-sm hover:bg-red-50"
      >
        {isChecking ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Проверка...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Проверить соединение
          </>
        )}
      </button>
    </div>
  );
}