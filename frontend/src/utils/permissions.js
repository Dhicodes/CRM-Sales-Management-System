// Mirrors the backend's isEditable() in leadService.js so the UI can hide
// controls a request would be rejected for anyway. The server remains the
// source of truth every mutation is still enforced there.
export function canEditLead(user, lead, assignableUserIds) {
  if (!user || !lead) return false;
  if (user.role === 'admin') return true;
  if (!lead.assignedTo) return false;
  const assignedId = String(lead.assignedTo._id || lead.assignedTo);
  return assignableUserIds.includes(assignedId);
}
