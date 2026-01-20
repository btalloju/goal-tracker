"use client";

import { useState } from "react";
import { updateMilestone } from "@/app/actions/milestones";
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
import type { Milestone } from "@prisma/client";

interface EditMilestoneDialogProps {
  milestone: Milestone;
  children: React.ReactNode;
}

export function EditMilestoneDialog({ milestone, children }: EditMilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [notes, setNotes] = useState(milestone.notes || "");
  const [dueDate, setDueDate] = useState(
    milestone.dueDate ? new Date(milestone.dueDate).toISOString().split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await updateMilestone(milestone.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to update milestone:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Journal</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes, reflections, or journal entries..."
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
