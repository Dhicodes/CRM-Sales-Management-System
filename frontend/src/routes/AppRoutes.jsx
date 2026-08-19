import { Routes, Route } from 'react-router-dom';
import HomePage from '../HomePage';
import LoginPage from '../features/auth/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';
import LeadsListPage from '../features/leads/LeadsListPage';
import LeadFormPage from '../features/leads/LeadFormPage';
import LeadDetailPage from '../features/leads/LeadDetailPage';
import CustomersListPage from '../features/customers/CustomersListPage';
import CustomerFormPage from '../features/customers/CustomerFormPage';
import CustomerDetailPage from '../features/customers/CustomerDetailPage';
import DealsListPage from '../features/deals/DealsListPage';
import DealFormPage from '../features/deals/DealFormPage';
import DealDetailPage from '../features/deals/DealDetailPage';
import MyActivitiesPage from '../features/activities/MyActivitiesPage';

// Feature routes (notifications, dashboard) are added in later phases.
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
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <LeadsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/new"
        element={
          <ProtectedRoute>
            <LeadFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
            <LeadDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id/edit"
        element={
          <ProtectedRoute>
            <LeadFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/new"
        element={
          <ProtectedRoute>
            <CustomerFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <CustomerDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:id/edit"
        element={
          <ProtectedRoute>
            <CustomerFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals"
        element={
          <ProtectedRoute>
            <DealsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals/new"
        element={
          <ProtectedRoute>
            <DealFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals/:id"
        element={
          <ProtectedRoute>
            <DealDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals/:id/edit"
        element={
          <ProtectedRoute>
            <DealFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <MyActivitiesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
