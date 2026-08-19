import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/authApi';
import { ROLE_LABELS } from '../utils/leadOptions';

function AppHeader() {
  const user = useAppSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-sm font-semibold text-slate-800">
          CRM Sales Management
        </Link>
        <Link to="/leads" className="text-sm text-slate-600 hover:text-slate-900">
          Leads
        </Link>
        <Link to="/customers" className="text-sm text-slate-600 hover:text-slate-900">
          Customers
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">
          {user?.name}{' '}
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {ROLE_LABELS[user?.role] ?? user?.role}
          </span>
        </span>
        <button
          onClick={() => logout()}
          disabled={isLoading}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {isLoading ? 'Signing out…' : 'Log out'}
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
