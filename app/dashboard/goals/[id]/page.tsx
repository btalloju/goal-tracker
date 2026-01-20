import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Calendar, Flag } from "lucide-react";
import { getGoal } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MilestoneList } from "@/components/dashboard/milestone-list";
import { CreateMilestoneDialog } from "@/components/forms/create-milestone-dialog";
import { GoalStatusSelect } from "@/components/dashboard/goal-status-select";
import { GoalActions } from "@/components/dashboard/goal-actions";
import type { GoalStatus, Priority } from "@prisma/client";

interface GoalPageProps {
  params: Promise<{ id: string }>;
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

const priorityLabels: Record<Priority, string> = {
  LOW: "Low Priority",
  MEDIUM: "Medium Priority",
  HIGH: "High Priority",
};

const priorityColors: Record<Priority, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-yellow-500",
  HIGH: "text-red-500",
};

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter(
    (m) => m.status === "COMPLETED"
  ).length;
  const progressPercent =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href={`/dashboard/categories/${goal.categoryId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{goal.title}</h1>
                <span title={priorityLabels[goal.priority]}>
                  <Flag className={`h-5 w-5 ${priorityColors[goal.priority]}`} />
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Badge
                  className={statusColors[goal.status]}
                  variant="secondary"
                >
                  {statusLabels[goal.status]}
                </Badge>
                <Link
                  href={`/dashboard/categories/${goal.categoryId}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {goal.category.name}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GoalStatusSelect goalId={goal.id} currentStatus={goal.status} />
          <GoalActions goal={goal} />
        </div>
      </div>

      {/* Goal Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goal.description ? (
              <p className="text-muted-foreground">{goal.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No description</p>
            )}

            <div className="flex items-center gap-6 pt-4 border-t">
              {goal.targetDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Flag
                  className={`h-4 w-4 ${priorityColors[goal.priority]}`}
                />
                <span className="text-sm">{priorityLabels[goal.priority]}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {Math.round(progressPercent)}%
            </div>
            <Progress value={progressPercent} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {completedMilestones} of {totalMilestones} milestones completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Milestones</h2>
          <CreateMilestoneDialog goalId={goal.id} />
        </div>
        <MilestoneList milestones={goal.milestones} goalId={goal.id} />
      </div>
    </div>
  );
}
