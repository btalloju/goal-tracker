"use client";

import { useState, useEffect } from "react";
import { Sparkles, Zap, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAIStatus } from "@/app/actions/ai";

const MAX_DAILY_CALLS = 10;

export function AISettings() {
  const [remainingCalls, setRemainingCalls] = useState<number | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      const status = await getAIStatus();
      setRemainingCalls(status.remainingCalls);
      setAiAvailable(status.available);
    }
    fetchStatus();
  }, []);

  const usedCalls = remainingCalls !== null ? MAX_DAILY_CALLS - remainingCalls : 0;
  const usagePercent = (usedCalls / MAX_DAILY_CALLS) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Features
        </CardTitle>
        <CardDescription>
          Powered by Google Gemini for intelligent goal planning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiAvailable && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Info className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              AI features are not configured. Contact support if this persists.
            </p>
          </div>
        )}

        {/* Daily Usage */}
        {aiAvailable && remainingCalls !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Daily AI Calls
              </span>
              <span className="font-medium">
                {usedCalls} / {MAX_DAILY_CALLS} used
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {remainingCalls} calls remaining today. Resets at midnight.
            </p>
          </div>
        )}

        {/* Features List */}
        <div className="pt-2 border-t space-y-2">
          <p className="text-sm font-medium">Available Features:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit text-xs">Goal Planning</Badge>
              AI-generated milestone suggestions
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit text-xs">Prioritization</Badge>
              Smart task ordering
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit text-xs">Profile</Badge>
              Auto-tracks skills gained
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
