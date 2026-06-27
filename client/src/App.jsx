import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import IntakeHub from './pages/IntakeHub'
import ReviewQueue from './pages/ReviewQueue'
import SalesBot from './pages/SalesBot'
import Calendar from './pages/Calendar'

function MainAppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'intake':
        return <IntakeHub />;
      case 'queue':
        return <ReviewQueue />;
      case 'bot':
        return <SalesBot />;
      case 'calendar':
        return <Calendar />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  )
}

export default App
