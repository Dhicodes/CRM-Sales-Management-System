import { Link } from 'react-router-dom';
import AppHeader from './components/AppHeader';

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-800">You're logged in</h1>
        <p className="text-slate-500">
          Customers, deals, and the dashboard will appear here in later phases.
        </p>
        <Link
          to="/leads"
          className="mt-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Go to Leads
        </Link>
      </main>
    </div>
  );
}

export default HomePage;
