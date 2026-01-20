"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditGoalDialog } from "@/components/forms/edit-goal-dialog";
import { DeleteGoalButton } from "@/components/dashboard/delete-goal-button";
import type { Priority } from "@prisma/client";

interface GoalActionsProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    priority: Priority;
    targetDate: Date | null;
    categoryId: string;
  };
}

export function GoalActions({ goal }: GoalActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditGoalDialog goal={goal}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        </EditGoalDialog>
        <DeleteGoalButton
          goalId={goal.id}
          goalTitle={goal.title}
          categoryId={goal.categoryId}
        >
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DeleteGoalButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
