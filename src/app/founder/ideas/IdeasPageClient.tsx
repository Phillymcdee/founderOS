'use client';

import { useState, useTransition } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { IdeasListView } from './IdeasListView';
import { NotificationToast, useNotifications } from './NotificationToast';
import type { Idea, IdeaExperiment } from '@prisma/client';

type IdeaWithExperiments = Idea & {
  experiments: IdeaExperiment[];
};

interface IdeasPageClientProps {
  initialColumns: Record<string, IdeaWithExperiments[]>;
  signalMap: Record<string, { source: string; content: string }>;
  view?: 'kanban' | 'list';
}

export function IdeasPageClient({
  initialColumns,
  signalMap,
  view = 'kanban',
}: IdeasPageClientProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [isPending, startTransition] = useTransition();
  const { notifications, removeNotification, showSuccess, showError } =
    useNotifications();

  const handleStateChange = async (ideaId: string, newState: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('ideaId', ideaId);
        formData.append('state', newState);

        const response = await fetch('/api/ideas/update-state', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to update state');
        }

        // Update local state optimistically
        setColumns((prev) => {
          const newColumns = { ...prev };
          let movedIdea: IdeaWithExperiments | null = null;

          // Find and remove idea from current column
          for (const [state, ideas] of Object.entries(newColumns)) {
            const index = ideas.findIndex((i) => i.id === ideaId);
            if (index !== -1) {
              movedIdea = ideas[index];
              newColumns[state] = ideas.filter((i) => i.id !== ideaId);
              break;
            }
          }

          // Add to new column
          if (movedIdea) {
            const updatedIdea = { ...movedIdea, state: newState };
            if (!newColumns[newState]) {
              newColumns[newState] = [];
            }
            newColumns[newState] = [...newColumns[newState], updatedIdea];
          }

          return newColumns;
        });

        // Show notification for VALIDATED state
        if (newState === 'VALIDATED') {
          showSuccess(`🎉 Idea moved to VALIDATED! Ready to build.`);
        } else {
          showSuccess(`Idea state updated to ${newState.replace(/_/g, ' ')}`);
        }

        // Refresh page to get latest data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        showError('Failed to update idea state. Please try again.');
        console.error(error);
      }
    });
  };

  return (
    <>
      {view === 'kanban' ? (
        <KanbanBoard
          columns={columns}
          signalMap={signalMap}
          onStateChange={handleStateChange}
        />
      ) : (
        <IdeasListView
          columns={columns}
          signalMap={signalMap}
          onStateChange={handleStateChange}
        />
      )}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
}

