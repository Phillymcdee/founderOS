import { prisma } from '@/l0/db';
import {
  DEFAULT_BUSINESS_INTENT,
  type BusinessIntentResponse
} from '@/l3/businessIntent';
import {
  DEFAULT_IDEA_FILTERS,
  type IdeaFiltersResponse
} from '@/l3/ideasIntent';
import {
  updateBusinessIntentAction,
  updateIdeaIntentAction
} from './actions';

const DEMO_TENANT_ID = 'demo-tenant';

async function loadBusinessIntent(): Promise<BusinessIntentResponse> {
  const config = await prisma.businessIntentConfig.findUnique({
    where: { tenantId: DEMO_TENANT_ID }
  });

  if (!config) {
    return {
      intent: DEFAULT_BUSINESS_INTENT,
      version: 'default'
    };
  }

  return {
    intent: {
      targetMrr: config.targetMrr,
      acceptableChurnRate: config.acceptableChurnRate,
      alertThresholds: {
        churnRate: config.alertChurnRate,
        runwayMonths: config.alertRunwayMonths ?? null
      },
      summaryPreferences: {
        tone:
          config.summaryTone === 'narrative' ? 'narrative' : 'concise',
        maxActions: config.summaryMaxActions
      }
    },
    version: config.updatedAt.toISOString()
  };
}

async function loadIdeaIntent(): Promise<IdeaFiltersResponse> {
  const config = await prisma.ideaIntentConfig.findUnique({
    where: { tenantId: DEMO_TENANT_ID }
  });

  if (!config) {
    return {
      filters: DEFAULT_IDEA_FILTERS,
      version: 'default'
    };
  }

  return {
    filters: {
      arpuFloor: config.arpuFloor,
      excludedDomains: config.excludedDomains,
      founderStrengths: config.founderStrengths,
      agentFitKeywords: config.agentFitKeywords,
      minScoreForExperiment: config.minScoreForExperiment
    },
    version: config.updatedAt.toISOString()
  };
}

export default async function FounderSettingsPage() {
  const [{ intent: businessIntent, version: businessVersion }, { filters, version: ideaVersion }] =
    await Promise.all([loadBusinessIntent(), loadIdeaIntent()]);

  return (
    <div>
      <h1>Founder Settings</h1>
      <p>
        Tune business goals and idea selection criteria. All flows will read
        from these configs, and events include the current version for
        traceability.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2>Business Intent</h2>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Current version: {businessVersion}
        </p>
        <form
          action={updateBusinessIntentAction}
          style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}
        >
          <label>
            Target MRR ($/month)
            <input
              type="number"
              name="targetMrr"
              min={0}
              defaultValue={businessIntent.targetMrr}
            />
          </label>
          <label>
            Acceptable churn rate (0 - 1)
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              name="acceptableChurnRate"
              defaultValue={businessIntent.acceptableChurnRate}
            />
          </label>
          <label>
            Alert churn rate (0 - 1)
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              name="alertChurnRate"
              defaultValue={businessIntent.alertThresholds.churnRate}
            />
          </label>
          <label>
            Alert runway months (leave blank for none)
            <input
              type="number"
              min={0}
              name="alertRunwayMonths"
              defaultValue={businessIntent.alertThresholds.runwayMonths ?? ''}
            />
          </label>
          <label>
            Summary tone
            <select
              name="summaryTone"
              defaultValue={businessIntent.summaryPreferences.tone}
            >
              <option value="concise">Concise</option>
              <option value="narrative">Narrative</option>
            </select>
          </label>
          <label>
            Max recommended actions per summary
            <input
              type="number"
              min={1}
              max={10}
              name="summaryMaxActions"
              defaultValue={businessIntent.summaryPreferences.maxActions}
            />
          </label>
          <button type="submit">Save Business Intent</button>
        </form>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Idea Selection Intent</h2>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Current version: {ideaVersion}
        </p>
        <form
          action={updateIdeaIntentAction}
          style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}
        >
          <label>
            Minimum ARPU ($/month)
            <input
              type="number"
              min={0}
              name="arpuFloor"
              defaultValue={filters.arpuFloor}
            />
          </label>
          <label>
            Excluded domains (comma or newline separated)
            <textarea
              name="excludedDomains"
              rows={3}
              defaultValue={filters.excludedDomains.join('\n')}
            />
          </label>
          <label>
            Founder strengths (comma or newline separated)
            <textarea
              name="founderStrengths"
              rows={3}
              defaultValue={filters.founderStrengths.join('\n')}
            />
          </label>
          <label>
            Agent fit keywords (comma or newline separated)
            <textarea
              name="agentFitKeywords"
              rows={3}
              defaultValue={filters.agentFitKeywords.join('\n')}
            />
          </label>
          <label>
            Minimum score for experiment
            <input
              type="number"
              min={1}
              max={12}
              name="minScoreForExperiment"
              defaultValue={filters.minScoreForExperiment}
            />
          </label>
          <button type="submit">Save Idea Intent</button>
        </form>
      </section>
    </div>
  );
}

