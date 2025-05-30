import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"

interface MultiSelectButtonControlProps {
  category: string;
  options: Record<string, { shortcut: string | null }>;
  maxSelection: number;
  minSelection: number;
  selected: string[];
  onSelectionChange: (selection: string[]) => void;
  isFocused: boolean;
}

export function MultiSelectButtonControl({
  category,
  options,
  maxSelection,
  minSelection,
  selected,
  onSelectionChange,
  isFocused
}: MultiSelectButtonControlProps) {
  const [showError, setShowError] = useState(false);

  const handleSelection = (option: string) => {
    setShowError(false);
    let newSelected: string[];
    if (maxSelection === 1) {
      newSelected = [option];
    } else {
      if (selected.includes(option)) {
        newSelected = selected.filter(item => item !== option);
      } else {
        newSelected = [...selected, option].slice(-maxSelection);
      }
    }
    onSelectionChange(newSelected);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isFocused) return;
      
      const pressedKey = event.key.toUpperCase();
      const option = Object.entries(options).find(([_, value]) => value.shortcut?.toUpperCase() === pressedKey);
      if (option) {
        handleSelection(option[0]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [options, selected, isFocused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        setShowError(selected.length < minSelection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, minSelection]);

  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold mb-1.5">{category}</h3>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([option, { shortcut }]) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            onClick={() => handleSelection(option)}
            className="flex gap-0 items-center"
          >
            {option.split('').map((char, index) => {
              if (char.toLowerCase() === shortcut?.toLowerCase() && !option.slice(0, index).toLowerCase().includes(shortcut.toLowerCase())) {
                return <span key={`${option}-${index}`} className="font-bold underline underline-offset-4">{char}</span>;
              }
              return char;
            })}
            {!option.toLowerCase().includes(shortcut?.toLowerCase()) && shortcut && (
              <span className="ml-1">({shortcut})</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

