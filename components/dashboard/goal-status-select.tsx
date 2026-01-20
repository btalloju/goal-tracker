"use client";

import { useState } from "react";
import { updateGoal } from "@/app/actions/goals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GoalStatus } from "@prisma/client";

interface GoalStatusSelectProps {
  goalId: string;
  currentStatus: GoalStatus;
}

const statusLabels: Record<GoalStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export function GoalStatusSelect({ goalId, currentStatus }: GoalStatusSelectProps) {
  const [status, setStatus] = useState<GoalStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: GoalStatus) {
    setLoading(true);
    setStatus(newStatus);
    try {
      await updateGoal(goalId, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={status} onValueChange={(v) => handleChange(v as GoalStatus)} disabled={loading}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
