import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import FullPageSpinner from '../../components/FullPageSpinner';
import StageBadge from '../../components/StageBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import {
  useGetCustomerQuery,
  useAssignCustomerMutation,
  useGetCustomerDealsQuery,
  useGetCustomerTimelineQuery,
} from './customersApi';
import TimelineFeed from '../../components/TimelineFeed';
import FollowUpsSection from '../../components/FollowUpsSection';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { canEditCustomer } from '../../utils/permissions';

function CustomerDetailPage() {
  const { id } = useParams();
  const user = useAppSelector(selectCurrentUser);
  const { showSuccess, showError } = useToast();

  const { data, isLoading, isError, error, refetch } = useGetCustomerQuery(id);
  const { data: dealsData, isLoading: isLoadingDeals } = useGetCustomerDealsQuery(id);
  const { data: timelineData, isLoading: isLoadingTimeline } = useGetCustomerTimelineQuery(id);
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));

  const [assignCustomer, { isLoading: isAssigning }] = useAssignCustomerMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState('');

  if (isLoading) return <FullPageSpinner />;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load this customer.'}</p>
          <button
            onClick={refetch}
            className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  const customer = data.data;
  const deals = dealsData?.data || [];
  const editable = canEditCustomer(user, customer, assignableUserIds);
  const isManagerOrAdmin = user.role === 'admin' || user.role === 'sales_manager';

  const openConfirm = (value) => {
    setPendingValue(value);
    setConfirmOpen(true);
  };

  const confirmAssignment = async () => {
    try {
      await assignCustomer({ id, assignedTo: pendingValue }).unwrap();
      showSuccess('Customer assignment updated');
    } catch (err) {
      showError(err.data?.message || 'Failed to update assignment');
    } finally {
      setConfirmOpen(false);
    }
  };

  const pendingLabel = assignableUsers.find((u) => u._id === pendingValue)?.name || 'this user';

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/customers" className="text-sm text-slate-500 hover:underline">
          &larr; Back to Customers
        </Link>

        <div className="mt-3 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{customer.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Created {new Date(customer.createdAt).toLocaleDateString()} by {customer.createdBy?.name || 'Unknown'}
              {customer.originLead && (
                <>
                  {' '}
                  &middot; Converted from lead{' '}
                  <Link to={`/leads/${customer.originLead._id}`} className="underline">
                    {customer.originLead.name}
                  </Link>
                </>
              )}
            </p>
          </div>
          {editable && (
            <Link
              to={`/customers/${id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit details
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Contact</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-800">{customer.email || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-800">{customer.phone || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Company</dt>
                <dd className="text-slate-800">{customer.company || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Address</dt>
                <dd className="text-slate-800">{customer.address || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Assignment</h2>
            {isManagerOrAdmin ? (
              <select
                value={customer.assignedTo?._id || ''}
                onChange={(e) => openConfirm(e.target.value)}
                disabled={isAssigning}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              >
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-600">Assigned to you</p>
            )}
          </section>
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Deals</h2>
            <Link
              to={`/deals/new?customerId=${id}`}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              New Deal
            </Link>
          </div>

          {isLoadingDeals && <p className="text-sm text-slate-500">Loading deals…</p>}

          {!isLoadingDeals && deals.length === 0 && <p className="text-sm text-slate-400">No deals yet.</p>}

          {!isLoadingDeals && deals.length > 0 && (
            <ul className="space-y-3">
              {deals.map((deal) => (
                <li key={deal._id}>
                  <Link
                    to={`/deals/${deal._id}`}
                    className="block rounded-md border border-slate-100 p-3 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{deal.title}</span>
                      <StageBadge stage={deal.stage} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Value: {deal.currency} {deal.value.toLocaleString()}
                      </span>
                      <span>Probability: {deal.probability}%</span>
                      <span>
                        Expected revenue: {deal.currency} {deal.expectedRevenue.toLocaleString()}
                      </span>
                      <span>Expected close: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                      <span>Owner: {deal.assignedTo?.name || 'Unknown'}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-4">
          <FollowUpsSection relatedToType="Customer" relatedToId={id} />
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Timeline</h2>
          <TimelineFeed events={timelineData?.data} isLoading={isLoadingTimeline} />
        </section>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Update assignment"
        message={`Assign this customer to ${pendingLabel}?`}
        confirmLabel="Confirm"
        isLoading={isAssigning}
        onConfirm={confirmAssignment}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default CustomerDetailPage;
