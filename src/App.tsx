import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { GradesPage } from './pages/GradesPage';
import { SchedulePage } from './pages/SchedulePage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ContactsPage } from './pages/ContactsPage';
import { NewsPage } from './pages/NewsPage';
import { FAQPage } from './pages/FAQPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { OfflineIndicator } from './components/OfflineIndicator';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <PrivateRoute>
              <GradesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <PrivateRoute>
              <SchedulePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <ContactsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/news"
          element={
            <PrivateRoute>
              <NewsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <PrivateRoute>
              <FAQPage />
            </PrivateRoute>
          }
        />
        
        {/* Redirect all other routes to login if not authenticated, or home if authenticated */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
      <OfflineIndicator />
    </BrowserRouter>
  );
}

export default App;