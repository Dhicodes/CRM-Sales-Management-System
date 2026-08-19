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

// Customer has no unassigned pool every record already has an owner, so
// this is a plain scope-membership check (mirrors customerService.isInScope).
export function canEditCustomer(user, customer, assignableUserIds) {
  if (!user || !customer) return false;
  if (user.role === 'admin') return true;
  const assignedId = String(customer.assignedTo._id || customer.assignedTo);
  return assignableUserIds.includes(assignedId);
}

// Mirrors dealService.isInScope + the closed-deal lock: once a deal is Won
// or Lost, only an admin can still modify it (reopen it via stage change).
export function canEditDeal(user, deal, assignableUserIds) {
  if (!user || !deal) return false;
  if (user.role === 'admin') return true;
  if (['Won', 'Lost'].includes(deal.stage)) return false;
  const assignedId = String(deal.assignedTo._id || deal.assignedTo);
  return assignableUserIds.includes(assignedId);
}
