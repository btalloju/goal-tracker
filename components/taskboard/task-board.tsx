"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskList } from "./task-list";
import { CreateTaskInput } from "./create-task-input";
import type { TaskWithMilestone } from "@/app/actions/tasks";

interface TaskBoardProps {
  tasks: TaskWithMilestone[];
}

const STORAGE_KEY = "taskboard-collapsed";

export function TaskBoard({ tasks }: TaskBoardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

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
