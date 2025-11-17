'use client';

import { IdeaCard } from './IdeaCard';
import { colors, spacing, typography } from './styles';
import type { Idea, IdeaExperiment } from '@prisma/client';

type IdeaWithExperiments = Idea & {
  experiments: IdeaExperiment[];
};

interface IdeasListViewProps {
  columns: Record<string, IdeaWithExperiments[]>;
  signalMap: Record<string, { source: string; content: string }>;
  onStateChange: (ideaId: string, newState: string) => void;
}

export function IdeasListView({
  columns,
  signalMap,
  onStateChange,
}: IdeasListViewProps) {
  // Flatten all ideas from all columns into a single array
  const allIdeas = Object.values(columns).flat();

  // Sort by creation date (newest first)
  const sortedIdeas = [...allIdeas].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedIdeas.length === 0) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.ui.text.secondary,
        }}
      >
        No ideas yet. Click "Discover new ideas" to start.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      {sortedIdeas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          signalMap={signalMap}
          onStateChange={onStateChange}
        />
      ))}
    </div>
  );
}

