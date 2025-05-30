import React, { useState } from 'react';
import { Button } from "@/components/ui/button"

interface LabelCategoryProps {
  category: string;
  options: Record<string, { shortcut: string | null }>;
  maxSelection: number;
  minSelection: number;
  onSelectionChange: (category: string, selection: string[]) => void;
}

export function LabelCategory({ category, options, maxSelection, minSelection, onSelectionChange }: LabelCategoryProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelection = (option: string) => {
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
    setSelected(newSelected);
    onSelectionChange(category, newSelected);
  };

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
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
  }, [options, selected]);

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{category}</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([option, { shortcut }]) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            onClick={() => handleSelection(option)}
            className="flex items-center"
          >
            {option}
            {shortcut && <span className="ml-2 text-xs bg-gray-200 px-1 rounded">{shortcut}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}

