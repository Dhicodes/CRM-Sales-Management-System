import { EVENT_TYPE_LABELS } from '../utils/activityOptions';

function TimelineFeed({ events, isLoading }) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading timeline…</p>;
  }

  if (!events || events.length === 0) {
    return <p className="text-sm text-slate-400">No activity yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event._id} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{event.description}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {event.performedBy?.name || 'Unknown'} &middot; {new Date(event.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default TimelineFeed;
