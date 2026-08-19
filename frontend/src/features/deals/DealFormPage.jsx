import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import FullPageSpinner from '../../components/FullPageSpinner';
import { useGetDealQuery, useCreateDealMutation, useUpdateDealMutation } from './dealsApi';
import { useGetCustomersQuery } from '../customers/customersApi';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { useToast } from '../../components/ToastProvider';
import { canEditDeal } from '../../utils/permissions';
import { todayDateInputValue } from '../../utils/date';

const EMPTY_FORM = { title: '', value: '', currency: 'USD', expectedCloseDate: '' };

function DealFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const presetCustomerId = searchParams.get('customerId') || '';
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector(selectCurrentUser);

  const { data: dealData, isLoading: isLoadingDeal } = useGetDealQuery(id, { skip: !isEditMode });
  const { data: customersData } = useGetCustomersQuery({ limit: 100 }, { skip: isEditMode });
  const customers = customersData?.data?.items || [];
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));

  const [createDeal, { isLoading: isCreating }] = useCreateDealMutation();
  const [updateDeal, { isLoading: isUpdating }] = useUpdateDealMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [customerId, setCustomerId] = useState(presetCustomerId);
  const [assignedTo, setAssignedTo] = useState('');
  const [formError, setFormError] = useState(null);

  const deal = dealData?.data;

  useEffect(() => {
    if (isEditMode && deal) {
      setForm({
        title: deal.title || '',
        value: deal.value ?? '',
        currency: deal.currency || 'USD',
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : '',
      });
    }
  }, [isEditMode, deal]);

  if (isEditMode && isLoadingDeal) {
    return <FullPageSpinner />;
  }

  if (isEditMode && deal && !canEditDeal(user, deal, assignableUserIds)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-slate-600">You don't have permission to edit this deal.</p>
          <Link to={`/deals/${id}`} className="mt-4 inline-block text-sm text-slate-800 underline">
            Back to deal
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
      title: form.title.trim(),
      value: Number(form.value),
      currency: form.currency.trim() || 'USD',
      expectedCloseDate: form.expectedCloseDate,
    };

    try {
      if (isEditMode) {
        await updateDeal({ id, ...payload }).unwrap();
        showSuccess('Deal updated successfully');
        navigate(`/deals/${id}`);
      } else {
        payload.customerId = customerId;
        if (user.role !== 'sales_executive' && assignedTo) {
          payload.assignedTo = assignedTo;
        }
        const result = await createDeal(payload).unwrap();
        showSuccess('Deal created successfully');
        navigate(`/deals/${result.data._id}`);
      }
    } catch (err) {
      const message = err.data?.message || 'Something went wrong. Please try again.';
      const fieldErrors = err.data?.errors?.map((fe) => fe.message).join(' ') || '';
      setFormError([message, fieldErrors].filter(Boolean).join(' '));
      showError(message);
    }
  };

  const isSaving = isCreating || isUpdating;
  const presetCustomer = customers.find((c) => c._id === presetCustomerId);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">{isEditMode ? 'Edit Deal' : 'New Deal'}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          {!isEditMode && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer *</label>
              {presetCustomer ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {presetCustomer.name}
                </p>
              ) : (
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Select a customer
                  </option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <input
              required
              value={form.title}
              onChange={handleChange('title')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Value *</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.value}
                onChange={handleChange('value')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <input
                value={form.currency}
                onChange={handleChange('currency')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected close date *</label>
            <input
              required
              type="date"
              // Only enforced on creation an existing deal's date may
              // already be in the past (overdue), which is a valid state
              // that editing other fields shouldn't be blocked by.
              min={isEditMode ? undefined : todayDateInputValue()}
              value={form.expectedCloseDate}
              onChange={handleChange('expectedCloseDate')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {!isEditMode && user?.role !== 'sales_executive' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Owner</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="">Myself</option>
                {assignableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create deal'}
            </button>
            <Link
              to={isEditMode ? `/deals/${id}` : '/deals'}
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

export default DealFormPage;
