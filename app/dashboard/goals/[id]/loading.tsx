import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GoalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-muted rounded" />
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg" />
            <div>
              <div className="h-7 w-56 bg-muted rounded" />
              <div className="flex gap-3 mt-2">
                <div className="h-5 w-20 bg-muted rounded" />
                <div className="h-5 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded" />
          <div className="h-10 w-10 bg-muted rounded" />
        </div>
      </div>

      {/* Details Skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="h-5 w-16 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-3/4 bg-muted rounded mb-4" />
            <div className="flex gap-6 pt-4 border-t">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-5 w-20 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-16 bg-muted rounded mb-2" />
            <div className="h-2 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-40 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Milestones Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-10 w-32 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-muted rounded mb-2" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
