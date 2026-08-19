export const SOURCES = ['website', 'referral', 'social_media', 'email', 'phone'];
// Settable via the status dropdown 'converted' is reached only through the
// dedicated conversion flow, never a direct edit.
export const STATUSES = ['new', 'contacted', 'qualified', 'unqualified'];
// Every status a lead can actually be in used for the list-page filter,
// where filtering by "Converted" is legitimate even though it can't be set
// directly.
export const FILTERABLE_STATUSES = [...STATUSES, 'converted'];
export const PRIORITIES = ['low', 'medium', 'high'];

export const SOURCE_LABELS = {
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  email: 'Email',
  phone: 'Phone',
};

export const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Unqualified',
  converted: 'Converted',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
};
