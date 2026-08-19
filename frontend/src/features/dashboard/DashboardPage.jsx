import AppHeader from '../../components/AppHeader';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentUser } from '../auth/authSlice';
import { useGetDashboardSummaryQuery, useGetTeamPerformanceQuery } from './dashboardApi';
import { FILTERABLE_STATUSES, STATUS_LABELS } from '../../utils/leadOptions';
import { STAGES } from '../../utils/dealOptions';

const ROLE_TITLES = {
  admin: 'Company Dashboard',
  sales_manager: 'Team Dashboard',
  sales_executive: 'My Dashboard',
};

const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent || 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

function BarRow({ label, count, total, valueLabel }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 flex-shrink-0 text-sm text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-28 flex-shrink-0 text-right text-sm text-slate-600">
        {count}
        {valueLabel ? ` · ${valueLabel}` : ''}
      </span>
    </div>
  );
}

function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const canSeeTeam = user?.role === 'admin' || user?.role === 'sales_manager';

  const { data: summaryData, isLoading, isError, error, refetch } = useGetDashboardSummaryQuery();
  const { data: teamData, isLoading: isTeamLoading } = useGetTeamPerformanceQuery(undefined, { skip: !canSeeTeam });

  const summary = summaryData?.data;
  const team = teamData?.data || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold text-slate-800">{ROLE_TITLES[user?.role] || 'Dashboard'}</h1>

        {isLoading && <div className="p-10 text-center text-sm text-slate-500">Loading dashboard…</div>}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-red-600">{error?.data?.message || 'Failed to load dashboard.'}</p>
            <button
              onClick={refetch}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && summary && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total Leads" value={summary.totalLeads} />
              <StatCard label="Conversion Rate" value={`${summary.conversionRate}%`} />
              <StatCard label="Pipeline Value" value={currency(summary.pipelineValue)} />
              <StatCard label="Won Value" value={currency(summary.wonValue)} accent="text-emerald-600" />
              <StatCard label="Pending Follow-ups" value={summary.pendingFollowUps} />
              <StatCard label="Overdue Follow-ups" value={summary.overdueFollowUps} accent={summary.overdueFollowUps > 0 ? 'text-red-600' : undefined} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Leads by status</h2>
                {FILTERABLE_STATUSES.map((status) => (
                  <BarRow
                    key={status}
                    label={STATUS_LABELS[status]}
                    count={summary.leadsByStatus[status]?.count || 0}
                    total={summary.totalLeads}
                  />
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Deals by stage</h2>
                {STAGES.map((stage) => {
                  const stageData = summary.dealsByStage[stage] || { count: 0, value: 0 };
                  const totalDeals = STAGES.reduce((sum, s) => sum + (summary.dealsByStage[s]?.count || 0), 0);
                  return (
                    <BarRow
                      key={stage}
                      label={stage}
                      count={stageData.count}
                      total={totalDeals}
                      valueLabel={currency(stageData.value)}
                    />
                  );
                })}
              </div>
            </div>

            {canSeeTeam && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                  Team performance
                </h2>
                {isTeamLoading && <div className="p-6 text-center text-sm text-slate-500">Loading team performance…</div>}
                {!isTeamLoading && team.length === 0 && (
                  <div className="p-6 text-center text-sm text-slate-500">No team members yet.</div>
                )}
                {!isTeamLoading && team.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Rep</th>
                          <th className="px-4 py-3 font-medium">Leads</th>
                          <th className="px-4 py-3 font-medium">Converted</th>
                          <th className="px-4 py-3 font-medium">Conversion Rate</th>
                          <th className="px-4 py-3 font-medium">Deals Won</th>
                          <th className="px-4 py-3 font-medium">Revenue Closed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {team.map((row) => (
                          <tr key={row.user._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-800">{row.user.name}</td>
                            <td className="px-4 py-3 text-slate-600">{row.totalLeads}</td>
                            <td className="px-4 py-3 text-slate-600">{row.convertedLeads}</td>
                            <td className="px-4 py-3 text-slate-600">{row.conversionRate}%</td>
                            <td className="px-4 py-3 text-slate-600">{row.dealsWon}</td>
                            <td className="px-4 py-3 text-slate-600">{currency(row.revenueClosed)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
