import { useState } from 'react';
import { useCreateActivityMutation } from './activitiesApi';
import { useToast } from '../../components/ToastProvider';
import { TYPES, TYPE_LABELS } from '../../utils/activityOptions';

function ActivityFormModal({ relatedToType, relatedToId, onClose }) {
  const { showSuccess, showError } = useToast();
  const [createActivity, { isLoading }] = useCreateActivityMutation();

  const [type, setType] = useState('call');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createActivity({ type, relatedToType, relatedToId, dueDate, notes: notes.trim() || undefined }).unwrap();
      showSuccess('Follow-up added');
      onClose();
    } catch (err) {
      const message = err.data?.message || 'Failed to add follow-up.';
      const fieldErrors = err.data?.errors?.map((fe) => fe.message).join(' ') || '';
      setFormError([message, fieldErrors].filter(Boolean).join(' '));
      showError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">Add Follow-up</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due date *</label>
            <input
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? 'Saving…' : 'Add Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivityFormModal;
