import Link from "next/link";
import { Folder, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
    goals: {
      id: string;
      status: string;
    }[];
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const totalGoals = category.goals.length;
  const completedGoals = category.goals.filter((g) => g.status === "COMPLETED").length;
  const progressPercent = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <Link href={`/dashboard/categories/${category.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Folder className="h-5 w-5" style={{ color: category.color }} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {totalGoals} {totalGoals === 1 ? "goal" : "goals"}
            </span>
            <Badge variant="secondary">
              {completedGoals}/{totalGoals} done
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>
    </Link>
  );
}
