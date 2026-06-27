import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ContentGen from './pages/ContentGen'
import SalesBot from './pages/SalesBot'
import Calendar from './pages/Calendar'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'generator':
        return <ContentGen />;
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
  )
}

export default App
