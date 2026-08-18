import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import FullPageSpinner from '../../components/FullPageSpinner';
import { useGetLeadQuery, useCreateLeadMutation, useUpdateLeadMutation } from './leadsApi';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { useToast } from '../../components/ToastProvider';
import { canEditLead } from '../../utils/permissions';
import { SOURCES, PRIORITIES, SOURCE_LABELS, PRIORITY_LABELS } from '../../utils/leadOptions';

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', source: '', priority: 'medium' };

function LeadFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector(selectCurrentUser);

  const { data: leadData, isLoading: isLoadingLead } = useGetLeadQuery(id, { skip: !isEditMode });
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [assignedTo, setAssignedTo] = useState('');
  const [leaveInPool, setLeaveInPool] = useState(false);
  const [formError, setFormError] = useState(null);

  const lead = leadData?.data;

  useEffect(() => {
    if (isEditMode && lead) {
      setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || '',
        priority: lead.priority || 'medium',
      });
    }
  }, [isEditMode, lead]);

  if (isEditMode && isLoadingLead) {
    return <FullPageSpinner />;
  }

  if (isEditMode && lead && !canEditLead(user, lead, assignableUserIds)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-slate-600">You don't have permission to edit this lead.</p>
          <Link to={`/leads/${id}`} className="mt-4 inline-block text-sm text-slate-800 underline">
            Back to lead
          </Link>
        </main>
      </div>
    );
  }

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      source: form.source,
      priority: form.priority,
    };

    try {
      if (isEditMode) {
        await updateLead({ id, ...payload }).unwrap();
        showSuccess('Lead updated successfully');
        navigate(`/leads/${id}`);
      } else {
        if (user.role === 'sales_executive') {
          if (leaveInPool) payload.assignedTo = null;
        } else if (assignedTo) {
          payload.assignedTo = assignedTo;
        }
        const result = await createLead(payload).unwrap();
        showSuccess('Lead created successfully');
        navigate(`/leads/${result.data._id}`);
      }
    } catch (err) {
      const message = err.data?.message || 'Something went wrong. Please try again.';
      const fieldErrors = err.data?.errors?.map((fe) => fe.message).join(' ') || '';
      setFormError([message, fieldErrors].filter(Boolean).join(' '));
      showError(message);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">
          {isEditMode ? 'Edit Lead' : 'New Lead'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <input
              required
              value={form.name}
              onChange={handleChange('name')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
            <input
              value={form.company}
              onChange={handleChange('company')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Source *</label>
              <select
                required
                value={form.source}
                onChange={handleChange('source')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="" disabled>
                  Select a source
                </option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={form.priority}
                onChange={handleChange('priority')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEditMode && user?.role !== 'sales_executive' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assign to</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="">Leave unassigned</option>
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEditMode && user?.role === 'sales_executive' && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={leaveInPool}
                onChange={(e) => setLeaveInPool(e.target.checked)}
                className="rounded border-slate-300"
              />
              Leave unassigned in the pool (instead of assigning to me)
            </label>
          )}

          {formError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create lead'}
            </button>
            <Link
              to={isEditMode ? `/leads/${id}` : '/leads'}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default LeadFormPage;
