"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Sparkles, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskList } from "./task-list";
import { CreateTaskInput } from "./create-task-input";
import { prioritizeTasks } from "@/app/actions/ai";
import { reorderTasks, type TaskWithMilestone } from "@/app/actions/tasks";

interface TaskBoardProps {
  tasks: TaskWithMilestone[];
}

const STORAGE_KEY = "taskboard-collapsed";

export function TaskBoard({ tasks }: TaskBoardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
    setMounted(true);
  }, []);

  // Save collapsed state to localStorage
  function toggleCollapsed() {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(STORAGE_KEY, String(newState));
  }

  async function handlePrioritize() {
    // Only prioritize incomplete tasks
    const incompleteTasks = tasks.filter((t) => !t.completed);
    if (incompleteTasks.length < 2) {
      setAiError("Need at least 2 incomplete tasks to prioritize.");
      return;
    }

    setPrioritizing(true);
    setAiError(null);
    setAiReasoning(null);

    const result = await prioritizeTasks(
      incompleteTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        milestone: t.milestone
          ? {
              title: t.milestone.title,
              goal: {
                title: t.milestone.goal.title,
                priority: "MEDIUM", // We don't have priority in the milestone hierarchy
              },
            }
          : null,
      }))
    );

    setPrioritizing(false);

    if (result.success && result.orderedTaskIds) {
      // Apply the new order
      // Combine: AI-ordered incomplete tasks + completed tasks (keep at end)
      const completedTasks = tasks.filter((t) => t.completed);
      const newOrder = [...result.orderedTaskIds, ...completedTasks.map((t) => t.id)];

      await reorderTasks(newOrder);
      setAiReasoning(result.reasoning || null);
    } else {
      setAiError(result.error || "Failed to prioritize tasks.");
    }
  }

  const pendingCount = tasks.filter((t) => !t.completed).length;

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Collapsed toggle button (fixed on right edge) */}
      {isCollapsed && (
        <button
          onClick={toggleCollapsed}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground px-2 py-4 rounded-l-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          <div className="flex flex-col items-center gap-1">
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs font-medium writing-vertical">Tasks</span>
            {pendingCount > 0 && (
              <span className="bg-primary-foreground text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Expanded panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-background border-l shadow-lg transition-transform duration-300 z-50",
          isCollapsed ? "translate-x-full" : "translate-x-0",
          "w-80"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Today&apos;s Tasks</h2>
              {pendingCount > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleCollapsed}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* AI Prioritize Button */}
          {pendingCount >= 2 && (
            <div className="px-4 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handlePrioritize}
                disabled={prioritizing}
              >
                {prioritizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Prioritizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Prioritize for me
                  </>
                )}
              </Button>
            </div>
          )}

          {/* AI Reasoning Banner */}
          {aiReasoning && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">{aiReasoning}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0"
                  onClick={() => setAiReasoning(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* AI Error */}
          {aiError && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-destructive">{aiError}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0"
                  onClick={() => setAiError(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="flex-1 overflow-y-auto p-4">
            <TaskList tasks={tasks} />
          </div>

          {/* Add task input */}
          <div className="p-4 border-t">
            <CreateTaskInput />
          </div>

          {/* Collapse button */}
          <div className="p-4 pt-0">
            <Button
              variant="outline"
              className="w-full"
              onClick={toggleCollapsed}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop when expanded */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={toggleCollapsed}
        />
      )}
    </>
  );
}
