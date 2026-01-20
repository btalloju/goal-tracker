import { Card, CardContent } from "@/components/ui/card";

export default function CategoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-muted rounded" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg" />
            <div>
              <div className="h-7 w-40 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded mt-2" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded" />
          <div className="h-10 w-10 bg-muted rounded" />
        </div>
      </div>

      {/* Goals Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-muted rounded mb-2" />
                  <div className="h-4 w-full bg-muted rounded mb-3" />
                  <div className="flex gap-3">
                    <div className="h-5 w-20 bg-muted rounded" />
                    <div className="h-5 w-24 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
