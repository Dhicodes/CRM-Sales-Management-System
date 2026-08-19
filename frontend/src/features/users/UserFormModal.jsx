import { useState } from 'react';
import { useCreateUserMutation, useUpdateUserMutation } from './usersApi';
import { useToast } from '../../components/ToastProvider';
import { ROLES, ROLE_LABELS } from '../../utils/leadOptions';

// Same modal handles create and edit: `user` is null when creating. Password
// is only ever collected on create the backend has no "reset password" flow,
// consistent with there being no self-registration in this app.
function UserFormModal({ user, managers, onClose }) {
  const isEditMode = Boolean(user);
  const { showSuccess, showError } = useToast();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'sales_executive',
    managerId: user?.managerId || '',
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      managerId: form.role === 'sales_executive' ? form.managerId || null : null,
    };

    try {
      if (isEditMode) {
        await updateUser({ id: user._id, ...payload }).unwrap();
        showSuccess('User updated successfully');
      } else {
        await createUser({ ...payload, password: form.password }).unwrap();
        showSuccess('User created successfully');
      }
      onClose();
    } catch (err) {
      const message = err.data?.message || 'Something went wrong. Please try again.';
      const fieldErrors = err.data?.errors?.map((fe) => fe.message).join(' ') || '';
      setFormError([message, fieldErrors].filter(Boolean).join(' '));
      showError(message);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">{isEditMode ? 'Edit User' : 'New User'}</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <input
              required
              value={form.name}
              onChange={handleChange('name')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={handleChange('password')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">At least 6 characters. Share this with the user directly.</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role *</label>
            <select
              value={form.role}
              onChange={handleChange('role')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {form.role === 'sales_executive' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Reports to (Manager) *</label>
              <select
                required
                value={form.managerId}
                onChange={handleChange('managerId')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="" disabled>
                  Select a manager
                </option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {managers.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">No active Sales Managers yet — create one first.</p>
              )}
            </div>
          )}

          {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
