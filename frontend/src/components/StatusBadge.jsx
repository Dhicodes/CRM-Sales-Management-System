import { STATUS_LABELS } from '../utils/leadOptions';

const COLORS = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-amber-50 text-amber-700',
  qualified: 'bg-purple-50 text-purple-700',
  unqualified: 'bg-slate-100 text-slate-500',
  converted: 'bg-emerald-50 text-emerald-700',
};

function StatusBadge({ status }) {
  const color = COLORS[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default StatusBadge;
