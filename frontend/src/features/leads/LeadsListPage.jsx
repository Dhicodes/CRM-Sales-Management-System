import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Pagination from '../../components/Pagination';
import { useGetLeadsQuery } from './leadsApi';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { SOURCES, STATUSES, PRIORITIES, SOURCE_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '../../utils/leadOptions';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: '-name', label: 'Name (Z-A)' },
];

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  priority: '',
  source: '',
  assignedTo: '',
  dateFrom: '',
  dateTo: '',
  sort: '-createdAt',
  page: 1,
  limit: 20,
};

function LeadsListPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 400);

  const queryParams = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useGetLeadsQuery(queryParams);
  const { data: assignableData } = useGetAssignableUsersQuery();

  const assignableUsers = assignableData?.data || [];
  const leads = data?.data?.items || [];
  const { page = 1, totalPages = 1, total = 0 } = data?.data || {};

  const hasActiveFilters =
    filters.search || filters.status || filters.priority || filters.source || filters.assignedTo || filters.dateFrom || filters.dateTo;

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Leads</h1>
          <Link
            to="/leads/new"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            New Lead
          </Link>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Search name, email, company…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none lg:col-span-2"
          />

          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>

          <select
            value={filters.source}
            onChange={(e) => updateFilter('source', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            value={filters.assignedTo}
            onChange={(e) => updateFilter('assignedTo', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {assignableUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
              aria-label="Created from"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
              aria-label="Created to"
            />
          </div>

          <select
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
          {isLoading && (
            <div className="p-10 text-center text-sm text-slate-500">Loading leads…</div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-red-600">
                {error?.data?.message || 'Failed to load leads.'}
              </p>
              <button
                onClick={refetch}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && leads.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-slate-500">
                {hasActiveFilters ? 'No leads match your filters.' : 'No leads yet.'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  to="/leads/new"
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Create your first lead
                </Link>
              )}
            </div>
          )}

          {!isLoading && !isError && leads.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Assigned To</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-100 ${isFetching ? 'opacity-60' : ''}`}>
                    {leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link to={`/leads/${lead._id}`} className="font-medium text-slate-800 hover:underline">
                            {lead.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{lead.company || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{SOURCE_LABELS[lead.source]}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={lead.priority} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {lead.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(lead.createdAt).toLocaleDateString()}
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

export default LeadsListPage;
