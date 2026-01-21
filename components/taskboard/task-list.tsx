"use client";

import { useOptimistic, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskItem } from "./task-item";
import { reorderTasks, type TaskWithMilestone } from "@/app/actions/tasks";

interface TaskListProps {
  tasks: TaskWithMilestone[];
}

export function TaskList({ tasks: initialTasks }: TaskListProps) {
  const [, startTransition] = useTransition();

  const [optimisticTasks, updateOptimisticTasks] = useOptimistic(
    initialTasks,
    (
      state: TaskWithMilestone[],
      action: { type: "toggle" | "reorder"; taskId?: string; newOrder?: string[] }
    ) => {
      if (action.type === "toggle" && action.taskId) {
        return state.map((task) =>
          task.id === action.taskId
            ? { ...task, completed: !task.completed }
            : task
        );
      }
      if (action.type === "reorder" && action.newOrder) {
        const taskMap = new Map(state.map((t) => [t.id, t]));
        return action.newOrder
          .map((id) => taskMap.get(id))
          .filter((t): t is TaskWithMilestone => t !== undefined);
      }
      return state;
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate goal-linked tasks and orphaned tasks
  const goalLinkedTasks = optimisticTasks.filter((t) => t.milestoneId);
  const orphanedTasks = optimisticTasks.filter((t) => !t.milestoneId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const allTaskIds = optimisticTasks.map((t) => t.id);
      const oldIndex = allTaskIds.indexOf(active.id as string);
      const newIndex = allTaskIds.indexOf(over.id as string);
      const newOrder = arrayMove(allTaskIds, oldIndex, newIndex);

      startTransition(async () => {
        updateOptimisticTasks({ type: "reorder", newOrder });
        await reorderTasks(newOrder);
      });
    }
  }

  function handleOptimisticToggle(taskId: string) {
    updateOptimisticTasks({ type: "toggle", taskId });
  }

  if (optimisticTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No tasks for today</p>
        <p className="text-xs mt-1">Add a quick task or create milestone due dates</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {goalLinkedTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              From Your Goals
            </h4>
            <SortableContext
              items={goalLinkedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {goalLinkedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onOptimisticToggle={handleOptimisticToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}

        {orphanedTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Quick Tasks
            </h4>
            <SortableContext
              items={orphanedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {orphanedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onOptimisticToggle={handleOptimisticToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}
      </div>
    </DndContext>
  );
}
