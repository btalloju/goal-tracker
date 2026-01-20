"use client";

import { useState } from "react";
import { Check, Circle, Calendar, Trash2, MoreVertical } from "lucide-react";
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
import type { Milestone } from "@prisma/client";

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
  const [loading, setLoading] = useState(false);
  const isCompleted = milestone.status === "COMPLETED";

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleMilestoneStatus(milestone.id);
    } catch (error) {
      console.error("Failed to toggle milestone:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteMilestone(milestone.id);
    } catch (error) {
      console.error("Failed to delete milestone:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={`p-4 ${isCompleted ? "bg-muted/50" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? "bg-green-500 border-green-500 text-white"
              : "border-muted-foreground hover:border-primary"
          }`}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-medium ${
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
                {new Date(milestone.dueDate).toLocaleDateString()}
              </span>
            )}
            {isCompleted && milestone.completedAt && (
              <Badge variant="secondary" className="text-xs">
                Completed {new Date(milestone.completedAt).toLocaleDateString()}
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
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
              disabled={loading}
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
