"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Circle, Calendar, Trash2, MoreVertical, Pencil } from "lucide-react";
import { toggleMilestoneStatus, deleteMilestone } from "@/app/actions/milestones";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditMilestoneDialog } from "@/components/forms/edit-milestone-dialog";
import type { Milestone } from "@prisma/client";

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

interface MilestoneListProps {
  milestones: Milestone[];
  goalId: string;
}

export function MilestoneList({ milestones, goalId }: MilestoneListProps) {
  if (milestones.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Circle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">No milestones yet</h3>
        <p className="text-sm text-muted-foreground">
          Break down your goal into smaller, actionable milestones
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {milestones.map((milestone) => (
        <MilestoneItem key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    milestone.status,
    (_, newStatus: "PENDING" | "COMPLETED") => newStatus
  );

  const isCompleted = optimisticStatus === "COMPLETED";

  function handleToggle() {
    const newStatus = isCompleted ? "PENDING" : "COMPLETED";
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      try {
        await toggleMilestoneStatus(milestone.id);
      } catch (error) {
        console.error("Failed to toggle milestone:", error);
      }
    });
  }

  async function handleDelete() {
    try {
      await deleteMilestone(milestone.id);
    } catch (error) {
      console.error("Failed to delete milestone:", error);
    }
  }

  return (
    <Card className={`p-4 transition-colors ${isCompleted ? "bg-muted/50" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            isCompleted
              ? "bg-green-500 border-green-500 text-white"
              : "border-muted-foreground hover:border-primary"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-medium transition-all ${
              isCompleted ? "line-through text-muted-foreground" : ""
            }`}
          >
            {milestone.title}
          </p>
          {milestone.notes && (
            <p className="text-sm text-muted-foreground mt-1">{milestone.notes}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {milestone.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(milestone.dueDate)}
              </span>
            )}
            {isCompleted && milestone.completedAt && (
              <Badge variant="secondary" className="text-xs">
                Completed {formatDate(milestone.completedAt)}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditMilestoneDialog milestone={milestone}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </EditMilestoneDialog>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
