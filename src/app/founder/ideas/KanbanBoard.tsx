'use client';

import { useState } from 'react';
import { IdeaCard } from './IdeaCard';
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

  const stateColors: Record<string, { bg: string; border: string }> = {
    PENDING_REVIEW: { bg: '#fef3c7', border: '#fbbf24' },
    BACKLOG: { bg: '#e0e7ff', border: '#818cf8' },
    SCORING: { bg: '#dbeafe', border: '#60a5fa' },
    EXPERIMENTING: { bg: '#fce7f3', border: '#f472b6' },
    VALIDATED: { bg: '#d1fae5', border: '#34d399' },
    KILLED: { bg: '#fee2e2', border: '#f87171' }
  };

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
        gap: '1rem',
        alignItems: 'flex-start',
        overflowX: 'auto',
        padding: '1rem 0',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        minHeight: '400px'
      }}
    >
      {Object.entries(columns).map(([state, stateIdeas]) => {
        const colors = stateColors[state] || {
          bg: '#f3f4f6',
          border: '#9ca3af'
        };

        const isDragOver = dragOverColumn === state;

        return (
          <div
            key={state}
            style={{
              minWidth: '280px',
              maxWidth: '280px',
              backgroundColor: colors.bg,
              border: `2px solid ${isDragOver ? '#3b82f6' : colors.border}`,
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'all 0.2s',
              opacity: draggedIdea && !isDragOver && !stateIdeas.some(i => i.id === draggedIdea) ? 0.5 : 1
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
                marginBottom: '0.5rem'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {state.replace(/_/g, ' ')}
              </h3>
              <span
                style={{
                  backgroundColor: colors.border,
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {stateIdeas.length}
              </span>
            </div>
            {stateIdeas.length === 0 ? (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  margin: 0,
                  padding: '2rem 0',
                  textAlign: 'center'
                }}
              >
                {isDragOver ? 'Drop here' : 'No ideas'}
              </p>
            ) : (
              stateIdeas.map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={() => handleDragStart(idea.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    cursor: 'grab',
                    opacity: draggedIdea === idea.id ? 0.5 : 1
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

