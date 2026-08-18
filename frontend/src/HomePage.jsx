import { useAppSelector } from './app/hooks';
import { selectCurrentUser } from './features/auth/authSlice';
import { useLogoutMutation } from './features/auth/authApi';

const ROLE_LABELS = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
};

function HomePage() {
  const user = useAppSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-sm text-slate-500">CRM Sales Management System</p>
          <p className="font-medium text-slate-800">
            Welcome, {user?.name}{' '}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </span>
          </p>
        </div>
        <button
          onClick={() => logout()}
          disabled={isLoading}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {isLoading ? 'Signing out…' : 'Log out'}
        </button>
      </header>

      <main className="flex flex-col items-center justify-center gap-2 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-800">You're logged in</h1>
        <p className="text-slate-500">
          Leads, customers, deals, and the dashboard will appear here in later phases.
        </p>
      </main>
    </div>
  );
}

export default HomePage;
