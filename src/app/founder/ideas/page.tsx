import { prisma } from '@/l0/db';
import {
  createIdeaAction,
  evaluateIdeaAction,
  logExperimentAction,
  updateIdeaStateAction
} from './actions';
import { RefreshIdeasButton } from './RefreshIdeasButton';

const DEMO_TENANT_ID = 'demo-tenant';

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
        <h2>Idea Pipeline</h2>
        {ideas.length === 0 ? (
          <p>No ideas yet.</p>
        ) : (
          ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))
        )}
      </section>
    </div>
  );
}

function IdeaCard({
  idea
}: {
  idea: Awaited<ReturnType<typeof prisma.idea.findMany>>[number];
}) {
  const filterStatuses = [
    { label: 'Market/ARPU', value: idea.passesMarket },
    { label: 'Regulation/Safety', value: idea.passesRegulation },
    { label: 'Agent Fit', value: idea.passesAgentFit },
    { label: 'Founder Fit', value: idea.passesFounderFit }
  ];

  const scores = [
    { label: 'Pain & Frequency', value: idea.painFrequencyScore },
    { label: 'Agent Leverage', value: idea.agentLeverageScore },
    { label: 'Data Surface', value: idea.dataSurfaceScore },
    { label: 'Repeatability', value: idea.repeatabilityScore },
    { label: 'Total', value: idea.totalScore }
  ];

  return (
    <div
      style={{
        border: '1px solid #1f2937',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.25rem'
      }}
    >
      <h3>{idea.title}</h3>
      <p>{idea.description}</p>
      <p>
        <strong>State:</strong> {idea.state}
      </p>
      {idea.transformation && (
        <p>
          <strong>Transformation:</strong> {idea.transformation}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h4>Hard Filters</h4>
          <ul>
            {filterStatuses.map((filter) => (
              <li key={filter.label}>
                {filter.label}: {filter.value ? '✅' : '❌'}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Scores</h4>
          <ul>
            {scores.map((score) => (
              <li key={score.label}>
                {score.label}: {score.value ?? '-'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <form action={evaluateIdeaAction}>
          <input type="hidden" name="ideaId" value={idea.id} />
          <button type="submit">Run Filters & Scoring</button>
        </form>

        <form action={updateIdeaStateAction} style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="hidden" name="ideaId" value={idea.id} />
          <select name="state" defaultValue={idea.state}>
            <option value="BACKLOG">Backlog</option>
            <option value="SCORING">Scoring</option>
            <option value="EXPERIMENTING">Experimenting</option>
            <option value="VALIDATED">Validated</option>
            <option value="KILLED">Killed</option>
          </select>
          <button type="submit">Update State</button>
        </form>
      </div>

      <details style={{ marginTop: '1rem' }}>
        <summary>Log Validation Experiment</summary>
        <form
          action={logExperimentAction}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}
        >
          <input type="hidden" name="ideaId" value={idea.id} />
          <label>
            Type
            <select name="type" defaultValue="SIGNAL">
              <option value="SIGNAL">Signal Test</option>
              <option value="WORKFLOW">Workflow Depth Test</option>
              <option value="AGENT_OWNERSHIP">Agent Ownership Test</option>
            </select>
          </label>
          <label>
            Description
            <textarea
              name="description"
              placeholder="What did you test?"
              required
            />
          </label>
          <label>
            Result
            <select name="result" defaultValue="PENDING">
              <option value="PENDING">Pending</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="INCONCLUSIVE">Inconclusive</option>
            </select>
          </label>
          <button type="submit">Save Experiment</button>
        </form>
      </details>

      {idea.experiments.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Experiments</h4>
          <ul>
            {idea.experiments.map((experiment) => (
              <li key={experiment.id}>
                [{experiment.type}] {experiment.description} → {experiment.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


