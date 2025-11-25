import { prisma } from '@/l0/db';
import {
  createIdeaAction,
  evaluateIdeaAction,
  logExperimentAction,
  updateIdeaStateAction
} from './actions';
import { RefreshIdeasButton } from './RefreshIdeasButton';
import { IdeasPageClient } from './IdeasPageClient';
import { OptimizedIdeasPage } from './OptimizedIdeasPage';

export const dynamic = 'force-dynamic';

const DEMO_TENANT_ID = 'demo-tenant';

type IdeaWithExperiments = Awaited<
  ReturnType<typeof prisma.idea.findMany<{ include: { experiments: true } }>>
>[number];

export default async function IdeasDashboardPage() {
  const ideas = await prisma.idea.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    include: { experiments: true },
    orderBy: { createdAt: 'desc' }
  });

  const signals = await prisma.ideaSignal.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const topArchetypes = await prisma.archetypeInstance.findMany({
    where: {
      tenantId: DEMO_TENANT_ID,
      state: { notIn: ['KILLED', 'PAUSED'] }
    },
    orderBy: [
      { totalScore: 'desc' },
      { updatedAt: 'desc' }
    ],
    take: 5,
    include: {
      demandTests: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  const sourceSignalLookupIds = Array.from(
    new Set(
      ideas.flatMap((idea) => idea.sourceSignalIds ?? []).filter(Boolean)
    )
  );

  const sourceSignalLookup =
    sourceSignalLookupIds.length > 0
      ? await prisma.ideaSignal.findMany({
          where: { id: { in: sourceSignalLookupIds } }
        })
      : [];

  const signalMap = Object.fromEntries(
    sourceSignalLookup.map((signal) => [
      signal.id,
      { source: signal.source, content: signal.content }
    ])
  );

  const columns: Record<string, IdeaWithExperiments[]> = {
    PENDING_REVIEW: [],
    BACKLOG: [],
    SCORING: [],
    EXPERIMENTING: [],
    VALIDATED: [],
    KILLED: []
  };

  for (const idea of ideas) {
    if (columns[idea.state]) {
      columns[idea.state].push(idea);
    } else {
      columns.BACKLOG.push(idea);
    }
  }

  const topCandidates: IdeaWithExperiments[] = ideas
    .filter(
      (idea) =>
        idea.state === 'EXPERIMENTING' || idea.state === 'VALIDATED'
    )
    .sort(
      (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)
    )
    .slice(0, 3);

  const activeExperiments = ideas.flatMap((idea) =>
    idea.experiments.map((experiment) => ({
      ideaTitle: idea.title,
      id: experiment.id,
      type: experiment.type,
      description: experiment.description,
      result: experiment.result
    }))
  );

  // Use optimized layout for better UX
  return (
    <OptimizedIdeasPage
      initialColumns={columns}
      signalMap={signalMap}
      topCandidates={topCandidates}
      activeExperiments={activeExperiments}
      topArchetypes={topArchetypes.map((archetype) => ({
        id: archetype.id,
        label: archetype.label,
        patternKey: archetype.patternKey,
        icpKey: archetype.icpKey,
        icpDescription: archetype.icpDescription,
        totalScore: archetype.totalScore,
        monetizationScore: archetype.monetizationScore,
        dataSurfaceScore: archetype.dataSurfaceScore,
        agentLeverageScore: archetype.agentLeverageScore,
        reachabilityScore: archetype.reachabilityScore,
        osFitScore: archetype.osFitScore,
        lastDemandTest: archetype.demandTests[0] ?? null,
        lastUpdated: archetype.updatedAt
      }))}
      recentSignals={signals.map((s) => ({
        id: s.id,
        source: s.source,
        content: s.content,
        createdAt: s.createdAt,
      }))}
      totalIdeas={ideas.length}
      totalSignals={signals.length}
    />
  );

  // Legacy layout (commented out, can be restored if needed)
  /*
  return (
    <div>
      <h1>Founder Dashboard – Ideas</h1>
      <p>
        Capture candidate ideas, run them through the agent-native selection
        framework, and log validation experiments.
      </p>
      <div style={{ margin: '1rem 0' }}>
        <RefreshIdeasButton />
      </div>

      <section>
        <h2>New Idea</h2>
        <form action={createIdeaAction} style={{ display: 'grid', gap: '0.5rem' }}>
          <label>
            Title
            <input type="text" name="title" required placeholder="Idea title" />
          </label>
          <label>
            Description
            <textarea
              name="description"
              required
              placeholder="What is the idea?"
            />
          </label>
          <label>
            ICP / Inputs
            <input
              type="text"
              name="icpDescription"
              placeholder="Who is it for? (e.g., Agencies using Gmail)"
            />
          </label>
          <label>
            Estimated ARPU ($/month)
            <input type="number" name="arpuEstimate" min="0" />
          </label>
          <label>
            <input type="checkbox" name="regulatedConcern" /> Touches heavily
            regulated domain
          </label>
          <label>
            <input type="checkbox" name="manualWorkHeavy" /> Majority of work is
            manual/physical
          </label>
          <label>
            <input type="checkbox" name="founderFitSignal" defaultChecked /> Strong
            founder fit
          </label>
          <button type="submit">Add Idea</button>
        </form>
      </section>

      <section>
        <h2>Signals (Top 10)</h2>
        <ul>
          {signals.map((signal) => (
            <li key={signal.id}>
              [{signal.source}] {signal.content}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Idea Pipeline (Kanban)</h2>
        {ideas.length === 0 ? (
          <p>No ideas yet. Click "Discover new ideas" to start.</p>
        ) : (
          <IdeasPageClient initialColumns={columns} signalMap={signalMap} />
        )}
      </section>

      <section>
        <h2>Top Candidates</h2>
        {topCandidates.length === 0 ? (
          <p>No scored ideas yet. Run filters & scoring on some ideas.</p>
        ) : (
          <ul>
            {topCandidates.map((idea) => (
              <li key={idea.id}>
                <strong>{idea.title}</strong> – score{' '}
                {idea.totalScore ?? '-'} ({idea.state})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Active Experiments</h2>
        {activeExperiments.length === 0 ? (
          <p>No experiments logged yet.</p>
        ) : (
          <ul>
            {activeExperiments.map((exp) => (
              <li key={exp.id}>
                <strong>{exp.ideaTitle}</strong> – [{exp.type}] {exp.description}{' '}
                → {exp.result}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
  */
}

// IdeaCard moved to separate component file: src/app/founder/ideas/IdeaCard.tsx


