"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTask } from "@/app/actions/tasks";

export function CreateTaskInput() {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await createTask({ title: title.trim() });
      if (result.success) {
        setTitle("");
      } else {
        setError(result.error || "Failed to create task");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a quick task..."
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isPending || !title.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
