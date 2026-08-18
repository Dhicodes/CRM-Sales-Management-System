import { PRIORITY_LABELS } from '../utils/leadOptions';

const COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

function PriorityBadge({ priority }) {
  const color = COLORS[priority] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export default PriorityBadge;
