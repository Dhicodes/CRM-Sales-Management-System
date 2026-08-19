import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import FullPageSpinner from '../../components/FullPageSpinner';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import {
  useGetLeadQuery,
  useUpdateLeadMutation,
  useAssignLeadMutation,
  useAddLeadNoteMutation,
  useGetLeadTimelineQuery,
} from './leadsApi';
import ConvertLeadModal from './ConvertLeadModal';
import TimelineFeed from '../../components/TimelineFeed';
import FollowUpsSection from '../../components/FollowUpsSection';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { canEditLead } from '../../utils/permissions';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '../../utils/leadOptions';

function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const { showSuccess, showError } = useToast();

  const { data, isLoading, isError, error, refetch } = useGetLeadQuery(id);
  const { data: timelineData, isLoading: isLoadingTimeline } = useGetLeadTimelineQuery(id);
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));

  const [updateLead, { isLoading: isSavingField }] = useUpdateLeadMutation();
  const [assignLead, { isLoading: isAssigning }] = useAssignLeadMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddLeadNoteMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState('');
  const [noteText, setNoteText] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);

  if (isLoading) return <FullPageSpinner />;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load this lead.'}</p>
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

  const lead = data.data;
  const isConverted = lead.status === 'converted';
  const editable = !isConverted && canEditLead(user, lead, assignableUserIds);
  const isManagerOrAdmin = user.role === 'admin' || user.role === 'sales_manager';
  const canConvert = editable && lead.status === 'qualified';

  const openConfirm = (value) => {
    setPendingValue(value);
    setConfirmOpen(true);
  };

  const confirmAssignment = async () => {
    try {
      await assignLead({ id, assignedTo: pendingValue === '' ? null : pendingValue }).unwrap();
      showSuccess('Lead assignment updated');
    } catch (err) {
      showError(err.data?.message || 'Failed to update assignment');
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleClaim = async () => {
    try {
      await assignLead({ id, assignedTo: user._id }).unwrap();
      showSuccess('Lead assigned to you');
    } catch (err) {
      showError(err.data?.message || 'Failed to claim lead');
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await updateLead({ id, status: e.target.value }).unwrap();
      showSuccess('Status updated');
    } catch (err) {
      showError(err.data?.message || 'Failed to update status');
    }
  };

  const handlePriorityChange = async (e) => {
    try {
      await updateLead({ id, priority: e.target.value }).unwrap();
      showSuccess('Priority updated');
    } catch (err) {
      showError(err.data?.message || 'Failed to update priority');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await addNote({ id, text: noteText.trim() }).unwrap();
      setNoteText('');
      showSuccess('Note added');
    } catch (err) {
      showError(err.data?.message || 'Failed to add note');
    }
  };

  const pendingLabel =
    pendingValue === '' ? 'Unassigned (pool)' : assignableUsers.find((u) => u._id === pendingValue)?.name || 'this user';

  const notesNewestFirst = [...lead.notes].reverse();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/leads" className="text-sm text-slate-500 hover:underline">
          &larr; Back to Leads
        </Link>

        <div className="mt-3 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{lead.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {SOURCE_LABELS[lead.source]} &middot; Created {new Date(lead.createdAt).toLocaleDateString()} by{' '}
              {lead.createdBy?.name || 'Unknown'}
            </p>
          </div>
          <div className="flex gap-2">
            {canConvert && (
              <button
                onClick={() => setConvertOpen(true)}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Convert to Customer
              </button>
            )}
            {editable && (
              <Link
                to={`/leads/${id}/edit`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit details
              </Link>
            )}
          </div>
        </div>

        {isConverted && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            This lead has been converted.{' '}
            {lead.convertedToCustomer && (
              <Link to={`/customers/${lead.convertedToCustomer._id}`} className="font-medium underline">
                View customer: {lead.convertedToCustomer.name}
              </Link>
            )}
            {lead.convertedToDeal && (
              <>
                {' '}
                &middot; Deal: {lead.convertedToDeal.title} ({lead.convertedToDeal.stage})
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Contact</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-800">{lead.email || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-800">{lead.phone || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Company</dt>
                <dd className="text-slate-800">{lead.company || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Status &amp; Priority</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Status</label>
                {editable ? (
                  <select
                    value={lead.status}
                    onChange={handleStatusChange}
                    disabled={isSavingField}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={lead.status} />
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Priority</label>
                {editable ? (
                  <select
                    value={lead.priority}
                    onChange={handlePriorityChange}
                    disabled={isSavingField}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <PriorityBadge priority={lead.priority} />
                )}
              </div>
              {!editable && (
                <p className="text-xs text-slate-400">
                  {isConverted
                    ? 'This lead has been converted and can no longer be edited.'
                    : 'Claim this lead to edit its status or priority.'}
                </p>
              )}
            </div>
          </section>
        </div>

        {!isConverted && (
          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Assignment</h2>

            {isManagerOrAdmin && (
              <select
                value={lead.assignedTo?._id || ''}
                onChange={(e) => openConfirm(e.target.value)}
                disabled={isAssigning}
                className="w-full max-w-xs rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}

            {user.role === 'sales_executive' && !lead.assignedTo && (
              <button
                onClick={handleClaim}
                disabled={isAssigning}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isAssigning ? 'Claiming…' : 'Claim this lead'}
              </button>
            )}

            {user.role === 'sales_executive' && lead.assignedTo && String(lead.assignedTo._id) === String(user._id) && (
              <p className="text-sm text-slate-600">Assigned to you</p>
            )}
          </section>
        )}

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Notes</h2>

          {editable && (
            <form onSubmit={handleAddNote} className="mb-4 flex flex-col gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isAddingNote || !noteText.trim()}
                className="self-start rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isAddingNote ? 'Adding…' : 'Add note'}
              </button>
            </form>
          )}

          {notesNewestFirst.length === 0 ? (
            <p className="text-sm text-slate-400">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notesNewestFirst.map((note) => (
                <li key={note._id} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                  <p className="text-sm text-slate-700">{note.text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {note.author?.name || 'Unknown'} &middot; {new Date(note.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-4">
          <FollowUpsSection relatedToType="Lead" relatedToId={id} />
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Timeline</h2>
          <TimelineFeed events={timelineData?.data} isLoading={isLoadingTimeline} />
        </section>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Update assignment"
        message={`Assign this lead to ${pendingLabel}?`}
        confirmLabel="Confirm"
        isLoading={isAssigning}
        onConfirm={confirmAssignment}
        onCancel={() => setConfirmOpen(false)}
      />

      {convertOpen && (
        <ConvertLeadModal
          lead={lead}
          assignableUsers={assignableUsers}
          isManagerOrAdmin={isManagerOrAdmin}
          onClose={() => setConvertOpen(false)}
          onConverted={(result) => navigate(`/customers/${result.customer._id}`)}
        />
      )}
    </div>
  );
}

export default LeadDetailPage;
