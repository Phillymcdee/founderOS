'use client';

import { useState, useTransition } from 'react';
import { RefreshIdeasButton } from './RefreshIdeasButton';
import { IdeasPageClient } from './IdeasPageClient';
import { createIdeaAction } from './actions';
import { colors, spacing, typography, borderRadius, shadows, transitions } from './styles';
import type { Idea, IdeaExperiment } from '@prisma/client';

type IdeaWithExperiments = Idea & {
  experiments: IdeaExperiment[];
};

interface OptimizedIdeasPageProps {
  initialColumns: Record<string, IdeaWithExperiments[]>;
  signalMap: Record<string, { source: string; content: string }>;
  topCandidates: IdeaWithExperiments[];
  topArchetypes: Array<{
    id: string;
    label: string;
    patternKey: string;
    icpKey: string;
    icpDescription?: string | null;
    totalScore?: number | null;
    monetizationScore?: number | null;
    dataSurfaceScore?: number | null;
    agentLeverageScore?: number | null;
    reachabilityScore?: number | null;
    osFitScore?: number | null;
    lastDemandTest: {
      id: string;
      verdict: string | null;
      outreachCount: number;
      positiveResponses: number;
      meetingsBooked: number;
      createdAt: Date;
    } | null;
    lastUpdated: Date;
  }>;
  activeExperiments: Array<{
    ideaTitle: string;
    id: string;
    type: string;
    description: string;
    result: string | null;
  }>;
  recentSignals: Array<{
    id: string;
    source: string;
    content: string;
    createdAt: Date;
  }>;
  totalIdeas: number;
  totalSignals: number;
}

export function OptimizedIdeasPage({
  initialColumns,
  signalMap,
  topCandidates,
  topArchetypes,
  activeExperiments,
  recentSignals,
  totalIdeas,
  totalSignals
}: OptimizedIdeasPageProps) {
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false);
  const [selectedView, setSelectedView] = useState<'kanban' | 'list'>('kanban');
  
  // IdeasPageClient handles its own state management, so we just pass the props

  const totalScore = Object.values(initialColumns).reduce(
    (sum, ideas) => sum + ideas.length,
    0
  );

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        padding: spacing.lg,
        backgroundColor: colors.ui.background,
      }}
    >
      {/* Header Section */}
      <header
        style={{
          marginBottom: spacing.xl,
          borderBottom: `2px solid ${colors.ui.border}`,
          paddingBottom: spacing.lg,
          maxWidth: '1600px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.md,
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: typography.sizes['3xl'],
                fontWeight: typography.weights.bold,
                color: colors.ui.text.primary,
                margin: 0,
                marginBottom: spacing.xs,
              }}
            >
              Ideas & Validation
            </h1>
            <p
              style={{
                fontSize: typography.sizes.base,
                color: colors.ui.text.secondary,
                margin: 0,
                maxWidth: '600px',
              }}
            >
              Discover, validate, and prioritize product ideas through the
              agent-native selection framework.
            </p>
          </div>
          <RefreshIdeasButton />
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: 'flex',
            gap: spacing.lg,
            flexWrap: 'wrap',
            marginTop: spacing.md,
          }}
        >
          <StatCard
            label="Total Ideas"
            value={totalIdeas}
            color={colors.ui.accent}
          />
          <StatCard
            label="Top Candidates"
            value={topCandidates.length}
            color={colors.score.high}
          />
          <StatCard
            label="Active Experiments"
            value={activeExperiments.length}
            color={colors.state.EXPERIMENTING.border}
          />
          <StatCard
            label="Signals Processed"
            value={totalSignals}
            color={colors.ui.text.secondary}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: spacing.xl,
          alignItems: 'start',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Primary: Kanban Board */}
        <main style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <h2
              style={{
                fontSize: typography.sizes.xl,
                fontWeight: typography.weights.semibold,
                color: colors.ui.text.primary,
                margin: 0,
              }}
            >
              Idea Pipeline
            </h2>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <ViewToggle
                selected={selectedView}
                onSelect={setSelectedView}
              />
            </div>
          </div>

          {Object.values(initialColumns).every(col => col.length === 0) ? (
            <EmptyKanbanState />
          ) : (
            <IdeasPageClient 
              initialColumns={initialColumns} 
              signalMap={signalMap}
              view={selectedView}
            />
          )}
        </main>

        {/* Sidebar: Quick Actions & Insights */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
            position: 'sticky',
            top: spacing.lg,
            alignSelf: 'start',
            maxHeight: 'calc(100vh - 3rem)',
            overflowY: 'auto',
            width: '320px',
            flexShrink: 0,
          }}
        >
          {/* Quick Actions */}
          <QuickActionsCard
            showNewIdeaForm={showNewIdeaForm}
            onToggleForm={() => setShowNewIdeaForm(!showNewIdeaForm)}
          />

          {/* Top Candidates */}
          {topCandidates.length > 0 && (
            <InsightCard title="Top Candidates" icon="⭐">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {topCandidates.map((idea) => (
                  <CandidateItem key={idea.id} idea={idea} />
                ))}
              </div>
            </InsightCard>
          )}

          {/* Top Archetype Instances */}
          {topArchetypes.length > 0 && (
            <InsightCard title="Top Archetype Plays" icon="🧩">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {topArchetypes.map((archetype) => (
                  <ArchetypeItem key={archetype.id} archetype={archetype} />
                ))}
              </div>
            </InsightCard>
          )}

          {/* Active Experiments */}
          {activeExperiments.length > 0 && (
            <InsightCard title="Active Experiments" icon="🧪">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {activeExperiments.slice(0, 5).map((exp) => (
                  <ExperimentItem key={exp.id} experiment={exp} />
                ))}
              </div>
            </InsightCard>
          )}

          {/* Recent Signals */}
          {recentSignals.length > 0 && (
            <InsightCard title="Recent Signals" icon="📡">
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {recentSignals.slice(0, 5).map((signal) => (
                  <SignalItem key={signal.id} signal={signal} />
                ))}
              </div>
            </InsightCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.ui.surface,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.ui.border}`,
        minWidth: '120px',
      }}
    >
      <div
        style={{
          fontSize: typography.sizes['2xl'],
          fontWeight: typography.weights.bold,
          color: color,
          marginBottom: spacing.xs,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: typography.sizes.sm,
          color: colors.ui.text.secondary,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ViewToggle({
  selected,
  onSelect,
}: {
  selected: 'kanban' | 'list';
  onSelect: (view: 'kanban' | 'list') => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: colors.ui.surface,
        borderRadius: borderRadius.md,
        padding: spacing.xs,
        border: `1px solid ${colors.ui.border}`,
      }}
    >
      <button
        onClick={() => onSelect('kanban')}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: typography.sizes.sm,
          fontWeight:
            selected === 'kanban'
              ? typography.weights.semibold
              : typography.weights.normal,
          backgroundColor:
            selected === 'kanban' ? colors.ui.background : 'transparent',
          color:
            selected === 'kanban'
              ? colors.ui.text.primary
              : colors.ui.text.secondary,
          border: 'none',
          borderRadius: borderRadius.sm,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
        }}
      >
        Kanban
      </button>
      <button
        onClick={() => onSelect('list')}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: typography.sizes.sm,
          fontWeight:
            selected === 'list'
              ? typography.weights.semibold
              : typography.weights.normal,
          backgroundColor:
            selected === 'list' ? colors.ui.background : 'transparent',
          color:
            selected === 'list'
              ? colors.ui.text.primary
              : colors.ui.text.secondary,
          border: 'none',
          borderRadius: borderRadius.sm,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
        }}
      >
        List
      </button>
    </div>
  );
}

function QuickActionsCard({
  showNewIdeaForm,
  onToggleForm,
}: {
  showNewIdeaForm: boolean;
  onToggleForm: () => void;
}) {
  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.ui.surface,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.ui.border}`,
        boxShadow: shadows.sm,
      }}
    >
      <h3
        style={{
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.semibold,
          color: colors.ui.text.primary,
          margin: 0,
          marginBottom: spacing.sm,
        }}
      >
        Quick Actions
      </h3>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Toggle form button clicked');
          onToggleForm();
        }}
        style={{
          width: '100%',
          padding: spacing.sm,
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.medium,
          backgroundColor: showNewIdeaForm
            ? colors.ui.accent
            : colors.ui.background,
          color: showNewIdeaForm ? 'white' : colors.ui.text.primary,
          border: `1px solid ${colors.ui.border}`,
          borderRadius: borderRadius.md,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
          marginBottom: spacing.sm,
        }}
      >
        {showNewIdeaForm ? '−' : '+'} Add Idea Manually
      </button>
      {showNewIdeaForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            try {
              await createIdeaAction(formData);
              onToggleForm(); // Close form after success
            } catch (error) {
              console.error('Failed to create idea:', error);
            }
          }}
          style={{
            marginTop: spacing.sm,
            padding: spacing.sm,
            backgroundColor: colors.ui.background,
            borderRadius: borderRadius.sm,
            border: `1px solid ${colors.ui.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              fontSize: typography.sizes.sm,
              color: colors.ui.text.primary,
            }}
          >
            Title *
            <input
              type="text"
              name="title"
              required
              placeholder="Idea title"
              style={{
                padding: spacing.xs,
                fontSize: typography.sizes.sm,
                border: `1px solid ${colors.ui.border}`,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.ui.surface,
                color: colors.ui.text.primary,
              }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              fontSize: typography.sizes.sm,
              color: colors.ui.text.primary,
            }}
          >
            Description *
            <textarea
              name="description"
              required
              placeholder="What is the idea?"
              rows={3}
              style={{
                padding: spacing.xs,
                fontSize: typography.sizes.sm,
                border: `1px solid ${colors.ui.border}`,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.ui.surface,
                color: colors.ui.text.primary,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              fontSize: typography.sizes.sm,
              color: colors.ui.text.primary,
            }}
          >
            ICP / Target Audience
            <input
              type="text"
              name="icpDescription"
              placeholder="Who is it for? (e.g., Agencies using Gmail)"
              style={{
                padding: spacing.xs,
                fontSize: typography.sizes.sm,
                border: `1px solid ${colors.ui.border}`,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.ui.surface,
                color: colors.ui.text.primary,
              }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              fontSize: typography.sizes.sm,
              color: colors.ui.text.primary,
            }}
          >
            Estimated ARPU ($/month)
            <input
              type="number"
              name="arpuEstimate"
              min="0"
              step="0.01"
              placeholder="0"
              style={{
                padding: spacing.xs,
                fontSize: typography.sizes.sm,
                border: `1px solid ${colors.ui.border}`,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.ui.surface,
                color: colors.ui.text.primary,
              }}
            />
          </label>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: typography.sizes.sm,
                color: colors.ui.text.primary,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                name="regulatedConcern"
                style={{
                  cursor: 'pointer',
                }}
              />
              Touches heavily regulated domain
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: typography.sizes.sm,
                color: colors.ui.text.primary,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                name="manualWorkHeavy"
                style={{
                  cursor: 'pointer',
                }}
              />
              Majority of work is manual/physical
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: typography.sizes.sm,
                color: colors.ui.text.primary,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                name="founderFitSignal"
                defaultChecked
                style={{
                  cursor: 'pointer',
                }}
              />
              Strong founder fit
            </label>
          </div>
          <button
            type="submit"
            style={{
              padding: spacing.sm,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              backgroundColor: colors.ui.accent,
              color: 'white',
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              transition: `all ${transitions.fast}`,
              marginTop: spacing.xs,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Add Idea
          </button>
        </form>
      )}
    </div>
  );
}

function InsightCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.ui.surface,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.ui.border}`,
        boxShadow: shadows.sm,
      }}
    >
      <h3
        style={{
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.semibold,
          color: colors.ui.text.primary,
          margin: 0,
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function CandidateItem({ idea }: { idea: IdeaWithExperiments }) {
  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return colors.score.none;
    if (score >= 9) return colors.score.high;
    if (score >= 7) return colors.score.medium;
    return colors.score.low;
  };

  return (
    <div
      style={{
        padding: spacing.sm,
        backgroundColor: colors.ui.background,
        borderRadius: borderRadius.sm,
        border: `1px solid ${colors.ui.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: spacing.xs,
        }}
      >
        <div
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium,
            color: colors.ui.text.primary,
            flex: 1,
          }}
        >
          {idea.title}
        </div>
        {idea.totalScore !== null && (
          <span
            style={{
              backgroundColor: getScoreColor(idea.totalScore),
              color: 'white',
              borderRadius: borderRadius.full,
              padding: `2px ${spacing.xs}`,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              minWidth: '24px',
              textAlign: 'center',
            }}
          >
            {idea.totalScore}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: typography.sizes.xs,
          color: colors.ui.text.secondary,
          textTransform: 'capitalize',
        }}
      >
        {idea.state.replace(/_/g, ' ').toLowerCase()}
      </div>
    </div>
  );
}

function ArchetypeItem({
  archetype
}: {
  archetype: OptimizedIdeasPageProps['topArchetypes'][number];
}) {
  const axes = [
    { label: 'ARR', value: archetype.monetizationScore },
    { label: 'Data', value: archetype.dataSurfaceScore },
    { label: 'Agents', value: archetype.agentLeverageScore },
    { label: 'Reach', value: archetype.reachabilityScore },
    { label: 'OS', value: archetype.osFitScore }
  ];

  const verdict = archetype.lastDemandTest?.verdict ?? 'NOT TESTED';
  const verdictColor =
    verdict === 'PASS'
      ? colors.score.high
      : verdict === 'FAIL'
        ? colors.score.low
        : colors.ui.text.secondary;

  return (
    <div
      style={{
        padding: spacing.sm,
        backgroundColor: colors.ui.background,
        borderRadius: borderRadius.sm,
        border: `1px solid ${colors.ui.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium,
            color: colors.ui.text.primary
          }}
        >
          {archetype.label}
        </div>
        {archetype.totalScore != null && (
          <span
            style={{
              backgroundColor:
                archetype.totalScore >= 11
                  ? colors.score.high
                  : archetype.totalScore >= 9
                    ? colors.score.medium
                    : colors.score.low,
              color: '#fff',
              borderRadius: borderRadius.full,
              padding: `2px ${spacing.xs}`,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold
            }}
          >
            {archetype.totalScore}
          </span>
        )}
      </div>
      {archetype.icpDescription && (
        <div
          style={{
            fontSize: typography.sizes.xs,
            color: colors.ui.text.secondary
          }}
        >
          {archetype.icpDescription}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: spacing.xs
        }}
      >
        {axes.map((axis) => (
          <div
            key={axis.label}
            style={{
              textAlign: 'center',
              backgroundColor: colors.ui.surface,
              borderRadius: borderRadius.sm,
              padding: `${spacing.xs} 0`,
              border: `1px solid ${colors.ui.border}`
            }}
          >
            <div
              style={{
                fontSize: typography.sizes.xs,
                color: colors.ui.text.secondary
              }}
            >
              {axis.label}
            </div>
            <div
              style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.ui.text.primary
              }}
            >
              {axis.value ?? '-'}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: typography.sizes.xs,
          marginTop: spacing.xs
        }}
      >
        <span style={{ color: colors.ui.text.secondary }}>
          Updated {archetype.lastUpdated.toLocaleDateString()}
        </span>
        <span style={{ color: verdictColor, fontWeight: typography.weights.semibold }}>
          {verdict}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: spacing.xs,
          marginTop: spacing.xs
        }}
      >
        <ArchetypeActionButton
          archetypeId={archetype.id}
          action="run"
          label="Test"
        />
        <ArchetypeActionButton
          archetypeId={archetype.id}
          action="pause"
          label="Pause"
        />
        <ArchetypeActionButton
          archetypeId={archetype.id}
          action="kill"
          label="Kill"
        />
      </div>
    </div>
  );
}

function ArchetypeActionButton({
  archetypeId,
  action,
  label
}: {
  archetypeId: string;
  action: 'run' | 'pause' | 'kill';
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const { runArchetypeDemandTestAction, pauseArchetypeAction, killArchetypeAction } = await import('./actions');
      if (action === 'run') {
        await runArchetypeDemandTestAction(archetypeId);
      } else if (action === 'pause') {
        await pauseArchetypeAction(archetypeId);
      } else if (action === 'kill') {
        await killArchetypeAction(archetypeId);
      }
    });
  };

  const buttonColor =
    action === 'run'
      ? colors.ui.accent
      : action === 'pause'
        ? colors.ui.text.secondary
        : colors.score.low;

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        flex: 1,
        padding: `${spacing.xs} ${spacing.sm}`,
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
        backgroundColor: buttonColor,
        color: 'white',
        border: 'none',
        borderRadius: borderRadius.sm,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition: `all ${transitions.fast}`
      }}
    >
      {isPending ? '...' : label}
    </button>
  );
}

function EmptyKanbanState() {
  return (
    <div
      style={{
        padding: spacing['2xl'],
        textAlign: 'center',
        backgroundColor: colors.ui.surface,
        borderRadius: borderRadius.md,
        border: `2px dashed ${colors.ui.border}`,
      }}
    >
      <div
        style={{
          fontSize: typography.sizes['2xl'],
          marginBottom: spacing.sm,
        }}
      >
        💡
      </div>
      <h3
        style={{
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          color: colors.ui.text.primary,
          margin: 0,
          marginBottom: spacing.xs,
        }}
      >
        No ideas yet
      </h3>
      <p
        style={{
          fontSize: typography.sizes.base,
          color: colors.ui.text.secondary,
          margin: 0,
          marginBottom: spacing.md,
        }}
      >
        Click "Discover new ideas" to start finding opportunities
      </p>
    </div>
  );
}

function ExperimentItem({
  experiment,
}: {
  experiment: {
    ideaTitle: string;
    type: string;
    result: string | null;
  };
}) {
  const getResultColor = (result: string | null) => {
    if (!result) return colors.ui.text.tertiary;
    if (result === 'PASSED') return colors.score.high;
    if (result === 'FAILED') return colors.score.low;
    return colors.ui.text.secondary;
  };

  return (
    <div
      style={{
        padding: spacing.sm,
        backgroundColor: colors.ui.background,
        borderRadius: borderRadius.sm,
        border: `1px solid ${colors.ui.border}`,
      }}
    >
      <div
        style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.medium,
          color: colors.ui.text.primary,
          marginBottom: spacing.xs,
        }}
      >
        {experiment.ideaTitle}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: typography.sizes.xs,
        }}
      >
        <span style={{ color: colors.ui.text.secondary }}>
          {experiment.type}
        </span>
        <span
          style={{
            color: getResultColor(experiment.result),
            fontWeight: typography.weights.semibold,
          }}
        >
          {experiment.result || 'PENDING'}
        </span>
      </div>
    </div>
  );
}

function SignalItem({
  signal,
}: {
  signal: {
    id: string;
    source: string;
    content: string;
    createdAt: Date;
  };
}) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      style={{
        padding: spacing.sm,
        backgroundColor: colors.ui.background,
        borderRadius: borderRadius.sm,
        border: `1px solid ${colors.ui.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: spacing.xs,
        }}
      >
        <span
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.semibold,
            color: colors.ui.accent,
            textTransform: 'uppercase',
          }}
        >
          {signal.source}
        </span>
        <span
          style={{
            fontSize: typography.sizes.xs,
            color: colors.ui.text.tertiary,
          }}
        >
          {formatDate(signal.createdAt)}
        </span>
      </div>
      <div
        style={{
          fontSize: typography.sizes.sm,
          color: colors.ui.text.secondary,
          lineHeight: 1.4,
        }}
      >
        {signal.content.length > 100
          ? `${signal.content.slice(0, 100)}...`
          : signal.content}
      </div>
    </div>
  );
}

