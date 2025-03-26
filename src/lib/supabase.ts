import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
}

// Create a more resilient Supabase client with better retry logic
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  // Add more resilient fetch behavior with timeout and retry
  fetch: (...args) => {
    // Use a custom fetch with timeout
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log('Supabase request timed out');
        reject(new Error('Request timeout'));
      }, 15000); // 15 second timeout
      
      fetch(...args)
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Fetch error in Supabase client:', error);
          reject(error);
        });
    });
  }
});

// Initialize connection status monitoring
let isOnline = true;
let lastConnectionAttempt = 0;
let connectionCheckInterval: number | null = null;

// Function to check connection status with debouncing
const checkConnection = async (force = false) => {
  const now = Date.now();
  // Don't check too frequently unless forced
  if (!force && now - lastConnectionAttempt < 3000) {
    return isOnline;
  }
  
  lastConnectionAttempt = now;
  
  try {
    // Simple lightweight check - just try to get session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (isOnline) {
        console.log('Connection status changed: offline (Auth error)', error);
      }
      isOnline = false;
      return false;
    }
    
    // If we get here, we have a connection to Supabase
    if (!isOnline) {
      console.log('Connection status changed: online (Auth check successful)');
    }
    isOnline = true;
    return true;
  } catch (error) {
    // Fallback to a simple fetch to check general internet connectivity
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      // If we get here, we have internet but Supabase might be down
      if (!isOnline) {
        console.log('Connection status changed: online (general internet only)');
      }
      isOnline = true;
      return true;
    } catch (fallbackError) {
      if (isOnline) {
        console.log('Connection status changed: offline (complete)', error);
      }
      isOnline = false;
      return false;
    }
  }
};

// Start monitoring connection
export const startConnectionMonitoring = () => {
  if (!connectionCheckInterval) {
    // Check immediately
    checkConnection(true);
    // Then check every 5 seconds
    connectionCheckInterval = window.setInterval(() => checkConnection(), 5000);
  }
};

// Stop monitoring connection
export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    window.clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

// Get current connection status
export const getConnectionStatus = () => {
  // Force a check if we're currently offline
  if (!isOnline) {
    // Don't wait for the async result, just trigger the check
    checkConnection(true);
  }
  return isOnline;
};

// Initialize connection monitoring
startConnectionMonitoring();

// Add a helper function to handle common auth errors
export const handleAuthError = (error: any): string => {
  if (!error) return 'Неизвестная ошибка';
  
  // Check for specific error codes
  if (error.code === 'invalid_credentials' || 
      error.message?.includes('Invalid login credentials')) {
    return 'Неверный email или пароль';
  }
  
  if (error.code === 'user_not_found' || 
      error.message?.includes('user not found')) {
    return 'Пользователь не найден';
  }
  
  if (error.code === 'email_not_confirmed' || 
      error.message?.includes('Email not confirmed')) {
    return 'Email не подтвержден. Пожалуйста, проверьте вашу почту';
  }
  
  if (error.code === 'invalid_grant' || 
      error.message?.includes('invalid grant')) {
    return 'Неверный email или пароль';
  }
  
  // Network related errors
  if (error.code === 'fetch_error' || 
      error.message?.includes('fetch') || 
      error.message?.includes('network') ||
      error.message?.includes('подключения')) {
    return 'Проблема с подключением к серверу. Пожалуйста, проверьте интернет-соединение';
  }
  
  // Return the original message if we don't have a specific handler
  return error.message || 'Произошла ошибка. Пожалуйста, попробуйте позже';
};

// Function to clear all auth data from local storage
export const clearAuthData = () => {
  try {
    localStorage.removeItem('supabase.auth.token');
    // Clear any other auth-related items that might be in localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};