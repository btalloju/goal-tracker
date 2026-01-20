import Link from "next/link";
import { Target, ChevronRight, Calendar, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { GoalStatus, Priority, Milestone } from "@prisma/client";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    status: GoalStatus;
    priority: Priority;
    targetDate: Date | null;
    milestones: Milestone[];
  };
}

const statusColors: Record<GoalStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
};

const statusLabels: Record<GoalStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

const priorityColors: Record<Priority, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-yellow-500",
  HIGH: "text-red-500",
};

export function GoalCard({ goal }: GoalCardProps) {
  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter((m) => m.status === "COMPLETED").length;
  const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <Link href={`/dashboard/goals/${goal.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{goal.title}</h3>
                  <Flag className={`h-4 w-4 shrink-0 ${priorityColors[goal.priority]}`} />
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {goal.description}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={statusColors[goal.status]} variant="secondary">
                    {statusLabels[goal.status]}
                  </Badge>
                  {goal.targetDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  )}
                  {totalMilestones > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {completedMilestones}/{totalMilestones} milestones
                    </span>
                  )}
                </div>
                {totalMilestones > 0 && (
                  <Progress value={progressPercent} className="h-1.5 mt-3" />
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
