import React, { forwardRef } from 'react';
import { Textarea } from "@/components/ui/textarea"

interface TextInputControlProps {
  category: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  minLength: number;
}

export const TextInputControl = forwardRef<HTMLTextAreaElement, TextInputControlProps>(
  ({ category, value, onChange, maxLength, minLength }, ref) => {
    return (
      <div className="mb-3">
        <h3 className="text-base font-semibold mb-1.5">{category}</h3>
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.altKey || e.metaKey) {
                // Insert a new line when Option+Enter (Mac) or Alt+Enter (Windows) is pressed
                e.preventDefault();
                const cursorPosition = e.currentTarget.selectionStart;
                const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition);
                onChange(newValue);
                // Use requestAnimationFrame to ensure the DOM has updated
                requestAnimationFrame(() => {
                  const textarea = e.currentTarget;
                  if (textarea) {
                    textarea.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
                  }
                });
              }
              // Do not add any code here for regular Enter key press, as it will be handled by the parent component
            }
          }}
          className="w-full text-xs"
          rows={3}
          maxLength={maxLength}
          minLength={minLength}
        />
        <p className="text-xs text-gray-500 mt-1">
          {value.length}/{maxLength} characters (min: {minLength})
        </p>
      </div>
    );
  }
);

TextInputControl.displayName = 'TextInputControl';

