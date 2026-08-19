import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import FullPageSpinner from '../../components/FullPageSpinner';
import StageBadge from '../../components/StageBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { useGetDealQuery, useUpdateDealMutation, useAssignDealMutation, useGetDealTimelineQuery } from './dealsApi';
import { useDealStageChange } from './useDealStageChange';
import DealStageDialogs from './DealStageDialogs';
import TimelineFeed from '../../components/TimelineFeed';
import FollowUpsSection from '../../components/FollowUpsSection';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { canEditDeal } from '../../utils/permissions';
import { STAGES, CLOSED_STAGES } from '../../utils/dealOptions';

function DealDetailPage() {
  const { id } = useParams();
  const user = useAppSelector(selectCurrentUser);
  const { showSuccess, showError } = useToast();

  const { data, isLoading, isError, error, refetch } = useGetDealQuery(id);
  const { data: timelineData, isLoading: isLoadingTimeline } = useGetDealTimelineQuery(id);
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));

  const [assignDeal, { isLoading: isAssigning }] = useAssignDealMutation();
  const stageChange = useDealStageChange();

  const [assignConfirm, setAssignConfirm] = useState(null); // targetUserId

  if (isLoading) return <FullPageSpinner />;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load this deal.'}</p>
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

  const deal = data.data;
  const editable = canEditDeal(user, deal, assignableUserIds);
  const isManagerOrAdmin = user.role === 'admin' || user.role === 'sales_manager';

  const handleStageSelect = (e) => stageChange.requestStageChange(deal, e.target.value);

  const openAssignConfirm = (value) => setAssignConfirm(value);

  const confirmAssignment = async () => {
    try {
      await assignDeal({ id, assignedTo: assignConfirm }).unwrap();
      showSuccess('Deal assignment updated');
    } catch (err) {
      showError(err.data?.message || 'Failed to update assignment');
    } finally {
      setAssignConfirm(null);
    }
  };

  const assignConfirmLabel = assignableUsers.find((u) => u._id === assignConfirm)?.name || 'this user';

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/deals" className="text-sm text-slate-500 hover:underline">
          &larr; Back to Deals
        </Link>

        <div className="mt-3 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{deal.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Customer:{' '}
              <Link to={`/customers/${deal.customer._id}`} className="underline">
                {deal.customer.name}
              </Link>{' '}
              &middot; Created {new Date(deal.createdAt).toLocaleDateString()} by {deal.createdBy?.name || 'Unknown'}
            </p>
          </div>
          {editable && (
            <Link
              to={`/deals/${id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit details
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Value</dt>
                <dd className="text-slate-800">
                  {deal.currency} {deal.value.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Probability</dt>
                <dd className="text-slate-800">{deal.probability}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Expected revenue</dt>
                <dd className="text-slate-800">
                  {deal.currency} {deal.expectedRevenue.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Expected close</dt>
                <dd className="text-slate-800">{new Date(deal.expectedCloseDate).toLocaleDateString()}</dd>
              </div>
              {deal.actualCloseDate && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Actual close</dt>
                  <dd className="text-slate-800">{new Date(deal.actualCloseDate).toLocaleDateString()}</dd>
                </div>
              )}
              {deal.lossReason && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Loss reason</dt>
                  <dd className="text-slate-800">{deal.lossReason}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Stage</h2>
            {editable ? (
              <select
                value={deal.stage}
                onChange={handleStageSelect}
                disabled={stageChange.isChangingStage}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <StageBadge stage={deal.stage} />
            )}
            {!editable && CLOSED_STAGES.includes(deal.stage) && (
              <p className="mt-2 text-xs text-slate-400">This deal is closed. Only an admin can reopen it.</p>
            )}

            <div className="mt-4">
              <h3 className="mb-1 text-xs font-medium uppercase text-slate-500">Owner</h3>
              {isManagerOrAdmin ? (
                <select
                  value={deal.assignedTo?._id || ''}
                  onChange={(e) => openAssignConfirm(e.target.value)}
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
                <p className="text-sm text-slate-600">{deal.assignedTo?.name || 'Unassigned'}</p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-4">
          <FollowUpsSection relatedToType="Deal" relatedToId={id} />
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Timeline</h2>
          <TimelineFeed events={timelineData?.data} isLoading={isLoadingTimeline} />
        </section>
      </main>

      <ConfirmDialog
        open={Boolean(assignConfirm)}
        title="Update assignment"
        message={`Assign this deal to ${assignConfirmLabel}?`}
        confirmLabel="Confirm"
        isLoading={isAssigning}
        onConfirm={confirmAssignment}
        onCancel={() => setAssignConfirm(null)}
      />

      <DealStageDialogs {...stageChange} />
    </div>
  );
}

export default DealDetailPage;
