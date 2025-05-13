import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Required Supabase environment variables are missing');
}

// Retry configuration
const RETRY_COUNT = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const REQUEST_TIMEOUT = 15000; // 15 seconds

// Enhanced connection check with multiple fallback endpoints
const checkEndpoints = async () => {
  const endpoints = [
    { url: `${supabaseUrl}/rest/v1/`, headers: { 'apikey': supabaseAnonKey } },
    { url: 'https://www.google.com/favicon.ico', mode: 'no-cors' as RequestMode },
    { url: 'https://api.github.com/zen', mode: 'no-cors' as RequestMode }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        mode: endpoint.mode,
        headers: endpoint.headers,
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok || response.type === 'opaque') {
        return true;
      }
    } catch {
      continue;
    }
  }
  
  return false;
};

// Exponential backoff retry function with improved error handling
const retryWithBackoff = async (fn: () => Promise<any>, retries = RETRY_COUNT, delay = INITIAL_RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) {
      // Enhanced error reporting
      const errorDetails = {
        message: error.message,
        code: error.code,
        statusCode: error.status || error.statusCode,
        details: error.details || error.data,
        timestamp: new Date().toISOString()
      };
      
      console.error('Supabase request failed after all retries:', errorDetails);
      throw error;
    }
    
    console.log(`Retrying request. Attempts remaining: ${retries - 1}. Delay: ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, Math.min(delay * 2, 10000));
  }
};

// Create a more resilient Supabase client with enhanced error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'supabase.auth.token'
  },
  /* global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }, */
  // Enhanced fetch behavior with better timeout and retry logic
  fetch: async (...args) => {
    // Check connection before making request
    const online = await checkEndpoints();
    if (!online) {
      throw new Error('No network connection available. Please check your internet connection.');
    }

    return retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(...args, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Enhanced error handling for specific cases
          if (response.status === 409) {
            // Check for specific constraint violations
            if (errorData.message?.includes('idx_professors_email_lower')) {
              throw new Error('Преподаватель с таким email уже существует в системе');
            }
            
            const constraintMatch = errorData.message?.match(/violates unique constraint "([^"]+)"/);
            if (constraintMatch) {
              // Map known constraints to user-friendly messages
              const constraintMessages: Record<string, string> = {
                'professors_email_key': 'Преподаватель с таким email уже существует',
                'professors_phone_number_key': 'Преподаватель с таким номером телефона уже существует',
                'idx_professors_email_lower': 'Преподаватель с таким email уже существует в системе'
              };
              
              const message = constraintMessages[constraintMatch[1]] || 'Запись с такими данными уже существует';
              throw new Error(message);
            }
          }
          
          if (response.status === 429) {
            throw new Error('Too many requests. Please try again later.');
          }
          
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        throw error;
      }
    });
  }
});

// Initialize connection status monitoring
let isOnline = true;
let lastConnectionAttempt = 0;
let connectionCheckInterval: number | null = null;

// Enhanced connection status check with debouncing
const checkConnection = async (force = false) => {
  const now = Date.now();
  if (!force && now - lastConnectionAttempt < 3000) {
    return isOnline;
  }
  
  lastConnectionAttempt = now;
  const newStatus = await checkEndpoints();
  
  if (newStatus !== isOnline) {
    console.log(`Connection status changed: ${newStatus ? 'online' : 'offline'}`);
    isOnline = newStatus;
  }
  
  return isOnline;
};

// Start monitoring connection with error handling
export const startConnectionMonitoring = () => {
  if (!connectionCheckInterval) {
    try {
      checkConnection(true);
      connectionCheckInterval = window.setInterval(() => {
        checkConnection().catch(error => {
          console.error('Connection monitoring error:', error);
        });
      }, 5000);
    } catch (error) {
      console.error('Failed to start connection monitoring:', error);
    }
  }
};

// Stop monitoring connection
export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    window.clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

// Get current connection status with immediate check if offline
export const getConnectionStatus = () => {
  if (!isOnline) {
    checkConnection(true).catch(error => {
      console.error('Failed to check connection status:', error);
    });
  }
  return isOnline;
};

// Initialize connection monitoring
startConnectionMonitoring();

// Enhanced auth error handler with more specific error messages
export const handleAuthError = (error: any): string => {
  if (!error) return 'Неизвестная ошибка';
  
  const errorCode = error.code?.toLowerCase() || '';
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Database constraint errors - Enhanced with specific professor-related errors
  if (errorCode === '23505' || errorMessage.includes('duplicate key value')) {
    if (errorMessage.includes('idx_professors_email_lower')) {
      return 'Преподаватель с таким email уже существует в системе';
    }
    if (errorMessage.includes('professors_email_key')) {
      return 'Преподаватель с таким email уже существует';
    }
    if (errorMessage.includes('professors_phone_number_key')) {
      return 'Преподаватель с таким номером телефона уже существует';
    }
    return 'Запись с такими данными уже существует';
  }
  
  // Authentication errors
  if (errorCode.includes('invalid_credentials') || 
      errorMessage.includes('invalid login credentials')) {
    return 'Неверный email или пароль';
  }
  
  if (errorCode.includes('user_not_found') || 
      errorMessage.includes('user not found')) {
    return 'Пользователь не найден';
  }
  
  if (errorCode.includes('email_not_confirmed') || 
      errorMessage.includes('email not confirmed')) {
    return 'Email не подтвержден. Пожалуйста, проверьте вашу почту';
  }
  
  // Network and connection errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorCode === 'fetch_error') {
    return 'Проблема с подключением к серверу. Пожалуйста, проверьте интернет-соединение и попробуйте снова';
  }
  
  // Session errors
  if (errorMessage.includes('session expired') ||
      errorMessage.includes('invalid session')) {
    return 'Сессия истекла. Пожалуйста, войдите снова';
  }
  
  return error.message || 'Произошла ошибка. Пожалуйста, попробуйте позже';
};

// Enhanced auth data cleanup
export const clearAuthData = () => {
  try {
    // Clear all Supabase-related items
    const authKeys = ['supabase.auth.token', 'supabase.auth.refreshToken', 'supabase.auth.user'];
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear any other auth-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Clear session storage as well
    sessionStorage.clear();
    
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};