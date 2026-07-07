import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import IntakeHub from './pages/IntakeHub'
import ReviewQueue from './pages/ReviewQueue'
import SalesBot from './pages/SalesBot'
import Calendar from './pages/Calendar'

function App() {
  return (
    <AuthProvider>
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="intake" element={<IntakeHub />} />
          <Route path="queue" element={<ReviewQueue />} />
          <Route path="bot" element={<SalesBot />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
    </AuthProvider>
  )
}

export default App
