import { useGetHealthQuery } from './app/api';

function HomePage() {
  const { data, isLoading, isError, error } = useGetHealthQuery();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-800">
        CRM Sales Management System
      </h1>
      <p className="text-slate-500">Project scaffold — Phase 1 setup</p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm">
        {isLoading && <p className="text-slate-500">Checking API connection…</p>}
        {isError && (
          <p className="text-red-600">
            API unreachable: {error?.status ?? 'unknown error'}
          </p>
        )}
        {data && (
          <p className="text-emerald-600">
            API connected — {data.message} ({data.data.env})
          </p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
