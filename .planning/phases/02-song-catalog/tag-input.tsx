"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // CRITICAL: prevents Enter from submitting the parent form
      const normalized = inputValue.toLowerCase().trim();
      if (normalized && !value.includes(normalized)) {
        onChange([...value, normalized]);
      }
      setInputValue("");
    }
    // Backspace on empty input removes last tag
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap gap-1 border rounded-md p-2 min-h-10 focus-within:ring-1 focus-within:ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 rounded-full hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {tag}</span>
          </button>
        </Badge>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? "Type a tag and press Enter" : ""}
        className="flex-1 outline-none text-sm bg-transparent min-w-24"
      />
    </div>
  );
}
