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

  const previousSnapshot = metricsSnapshot
    ? await prisma.metricsSnapshot.findFirst({
        where: {
          tenantId: DEMO_TENANT_ID,
          createdAt: { lt: metricsSnapshot.createdAt }
        },
        orderBy: { createdAt: 'desc' }
      })
    : null;

  const recentEvents = await prisma.event.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const pendingSummaryId =
    latestSummary && latestSummary.state === 'PENDING_APPROVAL'
      ? latestSummary.id
      : undefined;

  const changes: string[] = [];
  if (metricsSnapshot && previousSnapshot) {
    const mrrDelta = metricsSnapshot.mrr - previousSnapshot.mrr;
    const customersDelta =
      metricsSnapshot.activeCustomers - previousSnapshot.activeCustomers;

    if (mrrDelta !== 0) {
      changes.push(
        `MRR ${
          mrrDelta > 0 ? 'increased' : 'decreased'
        } by $${Math.abs(mrrDelta).toLocaleString()} since last snapshot.`
      );
    }
    if (customersDelta !== 0) {
      changes.push(
        `Active customers ${
          customersDelta > 0 ? 'increased' : 'decreased'
        } by ${Math.abs(customersDelta)}.`
      );
    }
    if (metricsSnapshot.newMrr !== previousSnapshot.newMrr) {
      const delta = metricsSnapshot.newMrr - previousSnapshot.newMrr;
      changes.push(
        `New MRR (30d) changed by $${delta.toLocaleString()} compared to the prior period.`
      );
    }
    if (metricsSnapshot.churnedMrr !== previousSnapshot.churnedMrr) {
      const delta = metricsSnapshot.churnedMrr - previousSnapshot.churnedMrr;
      changes.push(
        `Churned MRR (30d) changed by $${delta.toLocaleString()} compared to the prior period.`
      );
    }
  }

  const problems: string[] = [];
  const opportunities: string[] = [];

  if (metricsSnapshot) {
    if (metricsSnapshot.churnedMrr > 0) {
      problems.push('Churned MRR is non-zero this period.');
    }
    if (metricsSnapshot.newMrr === 0) {
      problems.push('No new MRR recorded in the last 30 days.');
    }
    if (metricsSnapshot.newMrr > metricsSnapshot.churnedMrr) {
      opportunities.push(
        'Net new MRR is positive — consider doubling down on what worked.'
      );
    }
  }

  if (!problems.length && !opportunities.length) {
    opportunities.push('No major issues detected. Stay the course this week.');
  }

  const recommendedMoves =
    latestSummary?.recommendedActions
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

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
            <h3>This Week&apos;s Recommended Moves</h3>
            {recommendedMoves.length ? (
              <ul>
                {recommendedMoves.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            ) : (
              <p>No recommended moves yet.</p>
            )}
          </div>
        ) : (
          <p>No summary generated yet. Run the weekly summary flow.</p>
        )}
      </section>

      <section>
        <h2>What Changed This Week</h2>
        {metricsSnapshot ? (
          changes.length ? (
            <ul>
              {changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          ) : (
            <p>No prior snapshot to compare against yet.</p>
          )
        ) : (
          <p>No metrics snapshot yet.</p>
        )}
      </section>

      <section>
        <h2>Problems &amp; Opportunities</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h3>Problems</h3>
            {problems.length ? (
              <ul>
                {problems.map((problem, idx) => (
                  <li key={idx}>{problem}</li>
                ))}
              </ul>
            ) : (
              <p>No major problems flagged from metrics.</p>
            )}
          </div>
          <div>
            <h3>Opportunities</h3>
            {opportunities.length ? (
              <ul>
                {opportunities.map((opportunity, idx) => (
                  <li key={idx}>{opportunity}</li>
                ))}
              </ul>
            ) : (
              <p>No obvious opportunities surfaced this week.</p>
            )}
          </div>
        </div>
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


