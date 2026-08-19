import { useState } from 'react';
import AppHeader from '../../components/AppHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { useGetUsersQuery, useUpdateUserMutation, useDeactivateUserMutation } from './usersApi';
import UserFormModal from './UserFormModal';
import { ROLE_LABELS } from '../../utils/leadOptions';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';

function UsersPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data, isLoading, isError, error, refetch } = useGetUsersQuery();
  const [updateUser] = useUpdateUserMutation();
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation();
  const { showSuccess, showError } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const users = data?.data || [];
  const managers = users.filter((u) => u.role === 'sales_manager' && u.isActive);
  const managerName = (id) => users.find((u) => String(u._id) === String(id))?.name;

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };
  const openEdit = (user) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleReactivate = async (user) => {
    try {
      await updateUser({ id: user._id, isActive: true }).unwrap();
      showSuccess('User reactivated');
    } catch (err) {
      showError(err.data?.message || 'Failed to reactivate user');
    }
  };

  const confirmDeactivate = async () => {
    try {
      await deactivateUser(deactivateTarget._id).unwrap();
      showSuccess('User deactivated');
    } catch (err) {
      showError(err.data?.message || 'Failed to deactivate user');
    } finally {
      setDeactivateTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Users</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create Sales Manager and Sales Executive accounts. There is no self-registration — every account is
              provisioned here.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            New User
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isLoading && <div className="p-10 text-center text-sm text-slate-500">Loading users…</div>}

          {isError && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load users.'}</p>
              <button
                onClick={refetch}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && users.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">No users yet.</div>
          )}

          {!isLoading && !isError && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Reports to</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[user.role] ?? user.role}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.role === 'sales_executive' ? managerName(user.managerId) || '—' : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEdit(user)}
                            className="text-xs font-medium text-slate-600 hover:underline"
                          >
                            Edit
                          </button>
                          {user.isActive ? (
                            <button
                              onClick={() => setDeactivateTarget(user)}
                              disabled={String(user._id) === String(currentUser._id)}
                              className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                              title={
                                String(user._id) === String(currentUser._id)
                                  ? 'You cannot deactivate your own account'
                                  : undefined
                              }
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(user)}
                              className="text-xs font-medium text-emerald-600 hover:underline"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {formOpen && <UserFormModal user={editingUser} managers={managers} onClose={() => setFormOpen(false)} />}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate user"
        message={`${deactivateTarget?.name} will no longer be able to log in or be assigned new records. This can be reversed.`}
        confirmLabel="Deactivate"
        danger
        isLoading={isDeactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

export default UsersPage;
