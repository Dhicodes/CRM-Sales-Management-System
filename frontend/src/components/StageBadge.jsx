const COLORS = {
  Qualification: 'bg-blue-50 text-blue-700',
  Discovery: 'bg-indigo-50 text-indigo-700',
  Proposal: 'bg-amber-50 text-amber-700',
  Negotiation: 'bg-orange-50 text-orange-700',
  Won: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-slate-100 text-slate-500',
};

function StageBadge({ stage }) {
  const color = COLORS[stage] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{stage}</span>
  );
}

export default StageBadge;
