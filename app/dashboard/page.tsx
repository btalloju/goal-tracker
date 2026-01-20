import Link from "next/link";
import { Plus, Target, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { getCategories } from "@/app/actions/categories";
import { getDashboardStats } from "@/app/actions/goals";
import { getUpcomingMilestones } from "@/app/actions/milestones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/dashboard/category-card";
import { CreateCategoryDialog } from "@/components/forms/create-category-dialog";

export default async function DashboardPage() {
  const [categories, stats, upcomingMilestones] = await Promise.all([
    getCategories(),
    getDashboardStats(),
    getUpcomingMilestones(5),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your goals and progress</p>
        </div>
        <CreateCategoryDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressGoals}</div>
            <p className="text-xs text-muted-foreground">Active goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedMilestones}/{stats.totalMilestones}
            </div>
            <Progress
              value={
                stats.totalMilestones > 0
                  ? (stats.completedMilestones / stats.totalMilestones) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        {categories.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No categories yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first category to start tracking goals
            </p>
            <CreateCategoryDialog />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Milestones</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {upcomingMilestones.map((milestone) => (
                  <li key={milestone.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <Link
                      href={`/dashboard/goals/${milestone.goal.id}`}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {milestone.goal.title}
                        </p>
                      </div>
                      {milestone.dueDate && (
                        <Badge variant="outline">
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
