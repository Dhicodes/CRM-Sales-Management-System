import { Routes, Route } from 'react-router-dom';
import HomePage from '../HomePage';
import LoginPage from '../features/auth/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

// Feature routes (leads, customers, deals, activities, notifications,
// dashboard) are added in later phases.
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
