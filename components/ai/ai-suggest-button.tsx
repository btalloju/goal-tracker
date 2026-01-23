"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AISuggestButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
}

export function AISuggestButton({
  onClick,
  loading = false,
  disabled = false,
  size = "sm",
}: AISuggestButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={loading || disabled}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          AI Suggest
        </>
      )}
    </Button>
  );
}
