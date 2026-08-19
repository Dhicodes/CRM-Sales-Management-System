import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import Pagination from '../../components/Pagination';
import StageBadge from '../../components/StageBadge';
import { useGetDealsQuery } from './dealsApi';
import { useDealStageChange } from './useDealStageChange';
import DealStageDialogs from './DealStageDialogs';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { canEditDeal } from '../../utils/permissions';
import { STAGES } from '../../utils/dealOptions';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: '-value', label: 'Value (high-low)' },
  { value: 'value', label: 'Value (low-high)' },
  { value: 'expectedCloseDate', label: 'Closing soonest' },
];

const DEFAULT_FILTERS = {
  search: '',
  stage: '',
  assignedTo: '',
  minValue: '',
  maxValue: '',
  dateFrom: '',
  dateTo: '',
  sort: '-createdAt',
  page: 1,
  limit: 20,
};

function DealCard({ deal, draggable, onDragStart }) {
  return (
    <Link
      to={`/deals/${deal._id}`}
      draggable={draggable}
      onDragStart={draggable ? (e) => onDragStart(e, deal) : undefined}
      title={draggable ? 'Drag to another stage, or click to open' : undefined}
      className={`block rounded-md border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 hover:shadow ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <p className="text-sm font-medium text-slate-800">{deal.title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{deal.customer?.name || 'Unknown customer'}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">
        {deal.currency} {deal.value.toLocaleString()}
      </p>
      <p className="text-xs text-slate-400">{deal.probability}% &middot; {deal.assignedTo?.name || 'Unassigned'}</p>
    </Link>
  );
}

function DealsListPage() {
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 400);

  const queryParams = useMemo(() => {
    const base = { ...filters, search: debouncedSearch };
    if (viewMode === 'kanban') {
      // Kanban shows the whole (filtered) pipeline at once, grouped client-side.
      return { ...base, stage: undefined, limit: 200, page: 1 };
    }
    return base;
  }, [filters, debouncedSearch, viewMode]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetDealsQuery(queryParams);
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));
  const user = useAppSelector(selectCurrentUser);
  const stageChange = useDealStageChange();
  const [dragOverStage, setDragOverStage] = useState(null);

  const deals = data?.data?.items || [];
  const { page = 1, totalPages = 1, total = 0 } = data?.data || {};
  const hasActiveFilters =
    filters.search || filters.stage || filters.assignedTo || filters.minValue || filters.maxValue || filters.dateFrom || filters.dateTo;

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleDragStart = (e, deal) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal._id);
  };

  const handleDropOnStage = (e, stage) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    const deal = deals.find((d) => d._id === dealId);
    if (deal) stageChange.requestStageChange(deal, stage);
  };

  const dealsByStage = useMemo(() => {
    const grouped = Object.fromEntries(STAGES.map((s) => [s, []]));
    deals.forEach((deal) => {
      if (grouped[deal.stage]) grouped[deal.stage].push(deal);
    });
    return grouped;
  }, [deals]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Deals</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`rounded px-3 py-1 font-medium ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`rounded px-3 py-1 font-medium ${viewMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                Kanban
              </button>
            </div>
            <Link
              to="/deals/new"
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              New Deal
            </Link>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Search title…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none lg:col-span-2"
          />

          {viewMode === 'table' && (
            <select
              value={filters.stage}
              onChange={(e) => updateFilter('stage', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">All stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <select
            value={filters.assignedTo}
            onChange={(e) => updateFilter('assignedTo', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">All assignees</option>
            {assignableUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min value"
            value={filters.minValue}
            onChange={(e) => updateFilter('minValue', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max value"
            value={filters.maxValue}
            onChange={(e) => updateFilter('maxValue', e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
              aria-label="Closing from"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
              aria-label="Closing to"
            />
          </div>

          {viewMode === 'table' && (
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
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading && <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading deals…</div>}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load deals.'}</p>
            <button
              onClick={refetch}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && deals.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              {hasActiveFilters ? 'No deals match your filters.' : 'No deals yet.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            ) : (
              <p className="text-xs text-slate-400">
                Deals are created directly for a customer, or by converting a qualified lead.
              </p>
            )}
          </div>
        )}

        {!isLoading && !isError && deals.length > 0 && viewMode === 'table' && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Probability</th>
                    <th className="px-4 py-3 font-medium">Expected Close</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-100 ${isFetching ? 'opacity-60' : ''}`}>
                  {deals.map((deal) => (
                    <tr key={deal._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/deals/${deal._id}`} className="font-medium text-slate-800 hover:underline">
                          {deal.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{deal.customer?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <StageBadge stage={deal.stage} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {deal.currency} {deal.value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{deal.probability}%</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{deal.assignedTo?.name || '—'}</td>
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
          </div>
        )}

        {!isLoading && !isError && deals.length > 0 && viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage((prev) => (prev === stage ? null : prev))}
                onDrop={(e) => handleDropOnStage(e, stage)}
                className={`w-64 shrink-0 rounded-md ${
                  dragOverStage === stage ? 'bg-slate-100 ring-2 ring-slate-300' : ''
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <StageBadge stage={stage} />
                  <span className="text-xs text-slate-400">{dealsByStage[stage].length}</span>
                </div>
                <div className="flex min-h-[3rem] flex-col gap-2 p-1">
                  {dealsByStage[stage].map((deal) => (
                    <DealCard
                      key={deal._id}
                      deal={deal}
                      draggable={canEditDeal(user, deal, assignableUserIds)}
                      onDragStart={handleDragStart}
                    />
                  ))}
                  {dealsByStage[stage].length === 0 && (
                    <p className="rounded-md border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                      No deals
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <DealStageDialogs {...stageChange} />
    </div>
  );
}

export default DealsListPage;
