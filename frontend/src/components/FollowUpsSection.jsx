import { useState } from 'react';
import { useGetActivitiesQuery, useUpdateActivityMutation, useDeleteActivityMutation } from '../features/activities/activitiesApi';
import ActivityFormModal from '../features/activities/ActivityFormModal';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './ToastProvider';
import { TYPE_LABELS } from '../utils/activityOptions';

function FollowUpsSection({ relatedToType, relatedToId }) {
  const { data, isLoading } = useGetActivitiesQuery({ relatedToType, relatedToId, limit: 50, sort: 'dueDate' });
  const [updateActivity] = useUpdateActivityMutation();
  const [deleteActivity, { isLoading: isDeleting }] = useDeleteActivityMutation();
  const { showSuccess, showError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const activities = data?.data?.items || [];

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

  const handleDelete = async () => {
    try {
      await deleteActivity(deleteConfirmId).unwrap();
      showSuccess('Follow-up deleted');
    } catch (err) {
      showError(err.data?.message || 'Failed to delete follow-up');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Follow-ups</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Add Follow-up
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {!isLoading && activities.length === 0 && <p className="text-sm text-slate-400">No follow-ups yet.</p>}

      {!isLoading && activities.length > 0 && (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a._id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{TYPE_LABELS[a.type]}</span>
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
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Due {new Date(a.dueDate).toLocaleDateString()} &middot; {a.assignedTo?.name || 'Unassigned'}
                </p>
                {a.notes && <p className="mt-1 text-xs text-slate-600">{a.notes}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  onClick={() => handleToggleComplete(a)}
                  className="text-xs font-medium text-slate-600 hover:underline"
                >
                  {a.status === 'completed' ? 'Reopen' : 'Mark complete'}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(a._id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <ActivityFormModal
          relatedToType={relatedToType}
          relatedToId={relatedToId}
          onClose={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        title="Delete follow-up"
        message="This follow-up will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        danger
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </section>
  );
}

export default FollowUpsSection;
