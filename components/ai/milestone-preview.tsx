"use client";

import { useState } from "react";
import { Check, X, Clock, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { SuggestedMilestone } from "@/app/actions/ai";

interface MilestonePreviewProps {
  milestones: SuggestedMilestone[];
  onAccept: (selectedMilestones: SuggestedMilestone[]) => void;
  onReject: () => void;
  loading?: boolean;
}

export function MilestonePreview({
  milestones,
  onAccept,
  onReject,
  loading = false,
}: MilestonePreviewProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(milestones.map((_, i) => i))
  );

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleAccept = () => {
    const selectedMilestones = milestones.filter((_, i) => selectedIndices.has(i));
    onAccept(selectedMilestones);
  };

  const selectedCount = selectedIndices.size;

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>AI Suggested Milestones</span>
        <Badge variant="secondary" className="ml-auto">
          {selectedCount} selected
        </Badge>
      </div>

      <div className="space-y-2">
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
              selectedIndices.has(index)
                ? "bg-background border-primary/50"
                : "bg-muted/50 border-transparent"
            }`}
          >
            <Checkbox
              checked={selectedIndices.has(index)}
              onCheckedChange={() => toggleSelection(index)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{milestone.title}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>~{milestone.estimatedDays} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCount === 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Select at least one milestone to add</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          type="button"
          size="sm"
          onClick={handleAccept}
          disabled={selectedCount === 0 || loading}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Add {selectedCount} Milestone{selectedCount !== 1 ? "s" : ""}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={loading}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
