"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmProps {
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirm({ onConfirm, isDeleting }: DeleteConfirmProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
      >
        Delete Song
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-destructive">Are you sure?</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Confirm Delete"}
      </Button>
    </div>
  );
}
