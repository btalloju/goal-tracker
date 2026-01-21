"use client";

import { useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  toggleTaskComplete,
  deleteTask,
  type TaskWithMilestone,
} from "@/app/actions/tasks";

interface TaskItemProps {
  task: TaskWithMilestone;
  onOptimisticToggle: (taskId: string) => void;
}

export function TaskItem({ task, onOptimisticToggle }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGoalLinked = !!task.milestone;

  function handleToggle() {
    startTransition(async () => {
      onOptimisticToggle(task.id);
      await toggleTaskComplete(task.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 p-3 bg-card border rounded-lg",
        isDragging && "opacity-50 shadow-lg",
        task.completed && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Checkbox
        checked={task.completed}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {isGoalLinked && task.milestone && (
          <div className="flex items-center gap-1 mt-1">
            <Target
              className="h-3 w-3"
              style={{ color: task.milestone.goal.category.color }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {task.milestone.goal.title}
            </span>
          </div>
        )}
        {task.notes && !isGoalLinked && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {task.notes}
          </p>
        )}
      </div>

      {!isGoalLinked && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
}
