'use client';

import { useState } from 'react';
import { RefreshIdeasButton } from './RefreshIdeasButton';
import { IdeasPageClient } from './IdeasPageClient';
import { colors, spacing, typography, borderRadius, shadows, transitions } from './styles';
import type { Idea, IdeaExperiment } from '@prisma/client';

type IdeaWithExperiments = Idea & {
  experiments: IdeaExperiment[];
};

interface OptimizedIdeasPageProps {
  initialColumns: Record<string, IdeaWithExperiments[]>;
  signalMap: Record<string, { source: string; content: string }>;
  topCandidates: IdeaWithExperiments[];
  activeExperiments: Array<{
    ideaTitle: string;
    id: string;
    type: string;
    description: string;
    result: string | null;
  }>;
  totalIdeas: number;
  totalSignals: number;
}

export function OptimizedIdeasPage({
  initialColumns,
  signalMap,
  topCandidates,
  activeExperiments,
  totalIdeas,
  totalSignals,
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
        backgroundColor: 'transparent',
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
        onClick={onToggleForm}
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
        <div
          style={{
            marginTop: spacing.sm,
            padding: spacing.sm,
            backgroundColor: colors.ui.background,
            borderRadius: borderRadius.sm,
            border: `1px solid ${colors.ui.border}`,
          }}
        >
          <p
            style={{
              fontSize: typography.sizes.sm,
              color: colors.ui.text.secondary,
              margin: 0,
            }}
          >
            Use "Discover new ideas" button above for automated discovery, or
            add manually via the form (to be implemented).
          </p>
        </div>
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

