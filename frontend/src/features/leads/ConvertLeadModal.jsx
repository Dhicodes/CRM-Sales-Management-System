import { useState } from 'react';
import { useConvertLeadMutation } from './leadsApi';
import { useToast } from '../../components/ToastProvider';

function ConvertLeadModal({ lead, assignableUsers, isManagerOrAdmin, onClose, onConverted }) {
  const { showSuccess, showError } = useToast();
  const [convertLead, { isLoading }] = useConvertLeadMutation();

  const [dealTitle, setDealTitle] = useState(`${lead.name} - Deal`);
  const [dealValue, setDealValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo?._id || '');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      dealTitle: dealTitle.trim(),
      dealValue: Number(dealValue),
      expectedCloseDate,
    };
    if (isManagerOrAdmin && assignedTo && assignedTo !== lead.assignedTo?._id) {
      payload.assignedTo = assignedTo;
    }

    try {
      const result = await convertLead({ id: lead._id, ...payload }).unwrap();
      showSuccess('Lead converted successfully');
      onConverted(result.data);
    } catch (err) {
      const message = err.data?.message || 'Failed to convert lead.';
      const fieldErrors = err.data?.errors?.map((fe) => fe.message).join(' ') || '';
      setFormError([message, fieldErrors].filter(Boolean).join(' '));
      showError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">Convert to Customer</h2>
        <p className="mt-1 text-sm text-slate-500">
          This creates a Customer and an initial Deal, and marks the lead as converted.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Deal title *</label>
            <input
              required
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Deal value *</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Expected close *</label>
              <input
                required
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {isManagerOrAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Owner</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {isLoading ? 'Converting…' : 'Convert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConvertLeadModal;
