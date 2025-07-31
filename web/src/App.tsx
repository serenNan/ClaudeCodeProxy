import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/layouts/AdminLayout';
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import ApiKeysPage from '@/pages/apikeys';
import AccountsPage from '@/pages/accounts';
import SettingsPage from '@/pages/settings';
import './App.css';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'apikeys', element: <ApiKeysPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider
          router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;