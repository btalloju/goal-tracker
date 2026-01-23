"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createGoal } from "@/app/actions/goals";
import { createMilestone } from "@/app/actions/milestones";
import { generateMilestones, type SuggestedMilestone } from "@/app/actions/ai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AISuggestButton } from "@/components/ai/ai-suggest-button";
import { MilestonePreview } from "@/components/ai/milestone-preview";
import type { Priority } from "@prisma/client";

interface CreateGoalDialogProps {
  categoryId: string;
}

export function CreateGoalDialog({ categoryId }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  // AI-related state
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedMilestones, setSuggestedMilestones] = useState<SuggestedMilestone[] | null>(null);
  const [selectedMilestones, setSelectedMilestones] = useState<SuggestedMilestone[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAISuggest() {
    if (!title.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setSuggestedMilestones(null);

    const result = await generateMilestones(title.trim(), description.trim() || undefined);

    setAiLoading(false);

    if (result.success && result.milestones) {
      setSuggestedMilestones(result.milestones);
    } else {
      setAiError(result.error || "Failed to generate suggestions");
    }
  }

  function handleAcceptMilestones(milestones: SuggestedMilestone[]) {
    setSelectedMilestones(milestones);
    setSuggestedMilestones(null);
  }

  function handleRejectMilestones() {
    setSuggestedMilestones(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const goal = await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        priority,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      });

      // Create milestones if any were selected
      if (selectedMilestones.length > 0) {
        const startDate = new Date();
        let cumulativeDays = 0;

        for (const milestone of selectedMilestones) {
          cumulativeDays += milestone.estimatedDays;
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + cumulativeDays);

          await createMilestone({
            title: milestone.title,
            goalId: goal.id,
            dueDate,
          });
        }
      }

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setTargetDate("");
      setSuggestedMilestones(null);
      setSelectedMilestones([]);
      setAiError(null);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create goal:", error);
    } finally {
      setLoading(false);
    }
  }

  const hasSelectedMilestones = selectedMilestones.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Run a marathon"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about your goal..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          {/* AI Milestones Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Milestones</Label>
              <AISuggestButton
                onClick={handleAISuggest}
                loading={aiLoading}
                disabled={!title.trim() || loading}
              />
            </div>

            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}

            {suggestedMilestones && (
              <MilestonePreview
                milestones={suggestedMilestones}
                onAccept={handleAcceptMilestones}
                onReject={handleRejectMilestones}
                loading={loading}
              />
            )}

            {hasSelectedMilestones && !suggestedMilestones && (
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <p className="text-sm font-medium">
                  {selectedMilestones.length} milestone{selectedMilestones.length !== 1 ? "s" : ""} will be created:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedMilestones.map((m, i) => (
                    <li key={i}>• {m.title}</li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMilestones([])}
                  className="mt-2"
                >
                  Clear milestones
                </Button>
              </div>
            )}

            {!suggestedMilestones && !hasSelectedMilestones && (
              <p className="text-sm text-muted-foreground">
                Enter a goal title and click &quot;AI Suggest&quot; to generate milestones automatically.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : hasSelectedMilestones ? "Create with Milestones" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
