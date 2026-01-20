import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { getCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalCard } from "@/components/dashboard/goal-card";
import { CreateGoalDialog } from "@/components/forms/create-goal-dialog";
import { DeleteCategoryButton } from "@/components/dashboard/delete-category-button";
import { EditCategoryDialog } from "@/components/forms/edit-category-dialog";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  const totalGoals = category.goals.length;
  const completedGoals = category.goals.filter((g) => g.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Folder className="h-6 w-6" style={{ color: category.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <p className="text-muted-foreground">
                {completedGoals} of {totalGoals} goals completed
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CreateGoalDialog categoryId={category.id} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditCategoryDialog category={category}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </EditCategoryDialog>
              <DeleteCategoryButton categoryId={category.id} categoryName={category.name}>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DeleteCategoryButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Goals List */}
      {category.goals.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Folder className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No goals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first goal in this category
          </p>
          <CreateGoalDialog categoryId={category.id} />
        </div>
      ) : (
        <div className="grid gap-4">
          {category.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
