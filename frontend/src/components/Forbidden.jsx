function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">403 — Access denied</h1>
      <p className="text-slate-500">You don't have permission to view this page.</p>
    </div>
  );
}

export default Forbidden;
