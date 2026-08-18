import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser, selectAuthStatus } from '../features/auth/authSlice';
import FullPageSpinner from './FullPageSpinner';
import Forbidden from './Forbidden';

function ProtectedRoute({ roles, children }) {
  const user = useAppSelector(selectCurrentUser);
  const status = useAppSelector(selectAuthStatus);

  if (status === 'idle' || status === 'loading') {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Forbidden />;
  }

  return children;
}

export default ProtectedRoute;
