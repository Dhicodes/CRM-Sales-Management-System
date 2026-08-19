import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import Pagination from '../../components/Pagination';
import { useGetActivitiesQuery, useUpdateActivityMutation, useDeleteActivityMutation } from './activitiesApi';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useToast } from '../../components/ToastProvider';
import { TYPES, TYPE_LABELS } from '../../utils/activityOptions';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
];

const RELATED_ROUTES = { Lead: 'leads', Customer: 'customers', Deal: 'deals' };

const DEFAULT_FILTERS = { status: '', type: '', assignedTo: '', page: 1, limit: 20, sort: 'dueDate' };

function MyActivitiesPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetActivitiesQuery(filters);
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];

  const [updateActivity] = useUpdateActivityMutation();
  const [deleteActivity] = useDeleteActivityMutation();
  const { showSuccess, showError } = useToast();

  const activities = data?.data?.items || [];
  const { page = 1, totalPages = 1, total = 0 } = data?.data || {};
  const hasActiveFilters = filters.status || filters.type || filters.assignedTo;

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleToggleComplete = async (activity) => {
    try {
      await updateActivity({
        id: activity._id,
        status: activity.status === 'completed' ? 'pending' : 'completed',
      }).unwrap();
      showSuccess(activity.status === 'completed' ? 'Follow-up reopened' : 'Follow-up completed');
    } catch (err) {
      showError(err.data?.message || 'Failed to update follow-up');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivity(id).unwrap();
      showSuccess('Follow-up deleted');
    } catch (err) {
      showError(err.data?.message || 'Failed to delete follow-up');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-slate-800">My Activities</h1>

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <select
            value={filters.assignedTo}
            onChange={(e) => updateFilter('assignedTo', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Everyone in scope</option>
            {assignableUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isLoading && <div className="p-10 text-center text-sm text-slate-500">Loading activities…</div>}

          {isError && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load activities.'}</p>
              <button
                onClick={refetch}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && activities.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              {hasActiveFilters ? 'No activities match your filters.' : 'No follow-ups yet.'}
            </div>
          )}

          {!isLoading && !isError && activities.length > 0 && (
            <>
              <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Related to</th>
                      <th className="px-4 py-3 font-medium">Due</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Owner</th>
                      <th className="px-4 py-3 font-medium">Notes</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activities.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{TYPE_LABELS[a.type]}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/${RELATED_ROUTES[a.relatedToType]}/${a.relatedToId}`}
                            className="text-slate-600 underline hover:text-slate-800"
                          >
                            View {a.relatedToType}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(a.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              a.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : a.isOverdue
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {a.status === 'completed' ? 'Completed' : a.isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{a.assignedTo?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{a.notes || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleComplete(a)}
                              className="text-xs font-medium text-slate-600 hover:underline"
                            >
                              {a.status === 'completed' ? 'Reopen' : 'Complete'}
                            </button>
                            <button
                              onClick={() => handleDelete(a._id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={(next) => setFilters((prev) => ({ ...prev, page: next }))}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyActivitiesPage;
