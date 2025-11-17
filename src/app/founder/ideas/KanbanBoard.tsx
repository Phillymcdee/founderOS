'use client';

import { useState } from 'react';
import { IdeaCard } from './IdeaCard';
import { colors, spacing, typography, borderRadius, shadows, transitions } from './styles';
import type { Idea, IdeaExperiment } from '@prisma/client';

type IdeaWithExperiments = Idea & {
  experiments: IdeaExperiment[];
};

interface KanbanBoardProps {
  columns: Record<string, IdeaWithExperiments[]>;
  signalMap: Record<string, { source: string; content: string }>;
  onStateChange: (ideaId: string, newState: string) => Promise<void>;
}

export function KanbanBoard({
  columns,
  signalMap,
  onStateChange
}: KanbanBoardProps) {
  const [draggedIdea, setDraggedIdea] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const stateColors = colors.state;

  const handleDragStart = (ideaId: string) => {
    setDraggedIdea(ideaId);
  };

  const handleDragOver = (e: React.DragEvent, columnState: string) => {
    e.preventDefault();
    setDragOverColumn(columnState);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetState: string) => {
    e.preventDefault();
    if (draggedIdea) {
      await onStateChange(draggedIdea, targetState);
      setDraggedIdea(null);
      setDragOverColumn(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdea(null);
    setDragOverColumn(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.md,
        alignItems: 'flex-start',
        overflowX: 'auto',
        padding: `${spacing.md} 0`,
        backgroundColor: colors.ui.surface,
        borderRadius: borderRadius.md,
        paddingLeft: spacing.md,
        paddingRight: spacing.md,
        minHeight: '500px',
        boxShadow: shadows.sm,
      }}
    >
      {Object.entries(columns).map(([state, stateIdeas]) => {
        const isDragOver = dragOverColumn === state;

        const stateColor = stateColors[state] || {
          bg: colors.ui.surface,
          border: colors.ui.border,
          text: colors.ui.text.primary,
        };

        return (
          <div
            key={state}
            style={{
              minWidth: '300px',
              maxWidth: '300px',
              backgroundColor: stateColor.bg,
              border: `2px solid ${isDragOver ? colors.ui.accent : stateColor.border}`,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              transition: `all ${transitions.normal}`,
              opacity: draggedIdea && !isDragOver && !stateIdeas.some(i => i.id === draggedIdea) ? 0.5 : 1,
              boxShadow: isDragOver ? shadows.md : shadows.sm,
              transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
            }}
            onDragOver={(e) => handleDragOver(e, state)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, state)}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.xs,
                paddingBottom: spacing.xs,
                borderBottom: `1px solid ${stateColor.border}`,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: typography.sizes.base,
                  fontWeight: typography.weights.semibold,
                  color: stateColor.text,
                  textTransform: 'capitalize',
                }}
              >
                {state.replace(/_/g, ' ')}
              </h3>
              <span
                style={{
                  backgroundColor: stateColor.border,
                  color: 'white',
                  borderRadius: borderRadius.full,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.sizes.sm,
                  fontWeight: typography.weights.semibold,
                  minWidth: '28px',
                  textAlign: 'center',
                }}
              >
                {stateIdeas.length}
              </span>
            </div>
            {stateIdeas.length === 0 ? (
              <div
                style={{
                  fontSize: typography.sizes.sm,
                  color: colors.ui.text.secondary,
                  fontStyle: 'italic',
                  margin: 0,
                  padding: spacing.xl,
                  textAlign: 'center',
                  borderRadius: borderRadius.sm,
                  border: isDragOver ? `2px dashed ${colors.ui.accent}` : `1px dashed ${stateColor.border}`,
                  backgroundColor: isDragOver ? `${colors.ui.accent}10` : 'transparent',
                  transition: `all ${transitions.fast}`,
                }}
              >
                {isDragOver ? '✨ Drop here' : 'No ideas'}
              </div>
            ) : (
              stateIdeas.map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={() => handleDragStart(idea.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    cursor: draggedIdea === idea.id ? 'grabbing' : 'grab',
                    opacity: draggedIdea === idea.id ? 0.5 : 1,
                    transition: `opacity ${transitions.fast}`,
                  }}
                >
                  <IdeaCard
                    idea={idea}
                    signalMap={signalMap}
                    onStateChange={onStateChange}
                  />
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

