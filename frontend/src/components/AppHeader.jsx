import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/authApi';
import { ROLE_LABELS } from '../utils/leadOptions';
import NotificationBell from './NotificationBell';

function AppHeader() {
  const user = useAppSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/leads', label: 'Leads' },
    { to: '/customers', label: 'Customers' },
    { to: '/deals', label: 'Deals' },
    { to: '/activities', label: 'My Activities' },
    ...(user?.role === 'admin' ? [{ to: '/users', label: 'Users' }] : []),
  ];

  const userBadge = (
    <span className="text-sm text-slate-600">
      {user?.name}{' '}
      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        {ROLE_LABELS[user?.role] ?? user?.role}
      </span>
    </span>
  );

  const logoutButton = (
    <button
      onClick={() => logout()}
      disabled={isLoading}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
    >
      {isLoading ? 'Signing out…' : 'Log out'}
    </button>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="shrink-0 text-sm font-semibold text-slate-800">
            CRM Sales Management
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm text-slate-600 hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden items-center gap-3 lg:flex">
            {userBadge}
            {logoutButton}
          </div>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-200 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            {userBadge}
            {logoutButton}
          </div>
        </nav>
      )}
    </header>
  );
}

export default AppHeader;
