import { prisma } from '@/l0/db';
import { SummaryActions } from './SummaryActions';

const DEMO_TENANT_ID = 'demo-tenant';

export default async function BusinessDashboardPage() {
  const [latestSummary] = await prisma.founderSummary.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    include: {
      metricsSnapshot: true
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  const metricsSnapshot =
    latestSummary?.metricsSnapshot ??
    (await prisma.metricsSnapshot.findFirst({
      where: { tenantId: DEMO_TENANT_ID },
      orderBy: { createdAt: 'desc' }
    }));

  const recentEvents = await prisma.event.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const pendingSummaryId =
    latestSummary && latestSummary.state === 'PENDING_APPROVAL'
      ? latestSummary.id
      : undefined;

  return (
    <div>
      <h1>Founder Dashboard – Business</h1>
      <p>
        View the latest metrics snapshot and weekly summary. Generate a new
        summary any time, then approve once you&apos;re satisfied.
      </p>
      <SummaryActions pendingSummaryId={pendingSummaryId} />

      <section>
        <h2>Latest Metrics Snapshot</h2>
        {metricsSnapshot ? (
          <table>
            <tbody>
              <tr>
                <th>Period End</th>
                <td>{metricsSnapshot.periodEnd.toDateString()}</td>
              </tr>
              <tr>
                <th>MRR</th>
                <td>${metricsSnapshot.mrr.toLocaleString()}</td>
              </tr>
              <tr>
                <th>New MRR (30d)</th>
                <td>${metricsSnapshot.newMrr.toLocaleString()}</td>
              </tr>
              <tr>
                <th>Churned MRR (30d)</th>
                <td>${metricsSnapshot.churnedMrr.toLocaleString()}</td>
              </tr>
              <tr>
                <th>Active Customers</th>
                <td>{metricsSnapshot.activeCustomers}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>No snapshot yet. Run the weekly summary flow to create one.</p>
        )}
      </section>

      <section>
        <h2>Weekly Founder Summary</h2>
        {latestSummary ? (
          <div
            style={{
              border: '1px solid #1f2937',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            <p>
              <strong>State:</strong> {latestSummary.state}
            </p>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#111827',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}
            >
              {latestSummary.narrative}
            </pre>
            <h3>Recommended Actions</h3>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#111827',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}
            >
              {latestSummary.recommendedActions}
            </pre>
          </div>
        ) : (
          <p>No summary generated yet. Run the weekly summary flow.</p>
        )}
      </section>

      <section>
        <h2>Recent Events</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.createdAt.toLocaleString()}</td>
                <td>{event.type}</td>
                <td>
                  <code>{JSON.stringify(event.payload || {})}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}


