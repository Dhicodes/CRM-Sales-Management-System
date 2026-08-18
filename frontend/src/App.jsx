import AppRoutes from './routes/AppRoutes';
import { useGetMeQuery } from './features/auth/authApi';

function App() {
  // Bootstraps auth state on load by checking the httpOnly session cookie.
  useGetMeQuery();
  return <AppRoutes />;
}

export default App;
