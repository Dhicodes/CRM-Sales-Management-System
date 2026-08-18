import AppRoutes from './routes/AppRoutes';
import { useGetMeQuery } from './features/auth/authApi';
import { ToastProvider } from './components/ToastProvider';

function App() {
  // Bootstraps auth state on load by checking the httpOnly session cookie.
  useGetMeQuery();
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
