import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import FullPageSpinner from '../../components/FullPageSpinner';
import { useGetCustomerQuery, useCreateCustomerMutation, useUpdateCustomerMutation } from './customersApi';
import { useGetAssignableUsersQuery } from '../users/usersApi';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { useToast } from '../../components/ToastProvider';
import { canEditCustomer } from '../../utils/permissions';

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', address: '' };

function CustomerFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector(selectCurrentUser);

  const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomerQuery(id, { skip: !isEditMode });
  const { data: assignableData } = useGetAssignableUsersQuery();
  const assignableUsers = assignableData?.data || [];
  const assignableUserIds = assignableUsers.map((u) => String(u._id));

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [assignedTo, setAssignedTo] = useState('');
  const [formError, setFormError] = useState(null);

  const customer = customerData?.data;

  useEffect(() => {
    if (isEditMode && customer) {
      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
      });
    }
  }, [isEditMode, customer]);

  if (isEditMode && isLoadingCustomer) {
    return <FullPageSpinner />;
  }

  if (isEditMode && customer && !canEditCustomer(user, customer, assignableUserIds)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-slate-600">You don't have permission to edit this customer.</p>
          <Link to={`/customers/${id}`} className="mt-4 inline-block text-sm text-slate-800 underline">
            Back to customer
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
      address: form.address.trim() || undefined,
    };

    try {
      if (isEditMode) {
        await updateCustomer({ id, ...payload }).unwrap();
        showSuccess('Customer updated successfully');
        navigate(`/customers/${id}`);
      } else {
        if (user.role !== 'sales_executive' && assignedTo) {
          payload.assignedTo = assignedTo;
        }
        const result = await createCustomer(payload).unwrap();
        showSuccess('Customer created successfully');
        navigate(`/customers/${result.data._id}`);
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
          {isEditMode ? 'Edit Customer' : 'New Customer'}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <input
              value={form.address}
              onChange={handleChange('address')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {!isEditMode && user?.role !== 'sales_executive' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assign to</label>
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

          {formError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create customer'}
            </button>
            <Link
              to={isEditMode ? `/customers/${id}` : '/customers'}
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

export default CustomerFormPage;
