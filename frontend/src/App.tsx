import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import { useEffect } from 'react'
import { TimezoneProvider } from './contexts/TimezoneContext'
import { SystemsProvider } from './contexts/SystemsContext'
import { CompanyProvider } from './contexts/CompanyContext'

// Страницы
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketForm from './pages/TicketForm'
import TicketView from './pages/TicketView'
import OperatorTickets from './pages/OperatorTickets'
import Settings from './pages/Settings'
import SystemSettings from './pages/SystemSettings'
import UsersManagement from './pages/UsersManagement'   // используется для /settings/users
import HomeRedirect from './components/HomeRedirect'
import DutySchedule from './pages/DutySchedule';

// Компоненты
// @ts-ignore
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка приложения...</p>
        </div>
      </div>
    )
  }

  return (
    <CompanyProvider>
      <SystemsProvider>
        <TimezoneProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Публичные маршруты */}
              <Route
                path="/login"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />

              {/* Защищенные маршруты */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* оператор */}
                <Route
                  path="operator"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <OperatorTickets />
                    </ProtectedRoute>
                  }
                />

                {/* Дашборд */}
                <Route index element={<HomeRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Заявки */}
                <Route path="tickets">
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="new" element={<TicketForm />} />
                  <Route path=":id" element={<TicketView />} />
                  <Route path=":id/edit" element={<TicketForm />} />
                </Route>

                {/* Отчеты (для админов и исполнителей) */}
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute requiredRole={['admin', 'executor']}>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Отчеты</h1>
                        <p className="text-gray-600 mt-2">Функционал в разработке</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* Настройки */}
                <Route path="settings" element={<Settings />} />
                <Route path="settings/systems" element={<SystemSettings />} />
                <Route
                  path="settings/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UsersManagement />
                    </ProtectedRoute>
                  }
                />
				
				<Route path="duty-schedule" element={<DutySchedule />} />
				
              </Route>

              {/* 404 страница */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-6">Страница не найдена</p>
                      <a href="/" className="btn-primary">
                        Вернуться на главную
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>
        </TimezoneProvider>
      </SystemsProvider>
    </CompanyProvider>
  )
}

export default App