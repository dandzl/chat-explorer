import React from 'react';
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

interface SliderControlProps {
  category: string;
  value: number;
  onChange: (value: number) => void;
  allowNA?: boolean;
  isNA: boolean;
  onNAChange: (checked: boolean) => void;
  allowDontKnow?: boolean;
  isDontKnow: boolean;
  onDontKnowChange: (checked: boolean) => void;
}

export function SliderControl({ 
  category, 
  value, 
  onChange, 
  allowNA, 
  isNA, 
  onNAChange, 
  allowDontKnow, 
  isDontKnow, 
  onDontKnowChange 
}: SliderControlProps) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold mb-1">{category}</h3>
      <div className={`flex items-center gap-3 ${isNA || isDontKnow ? 'opacity-50' : ''}`}>
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          max={5}
          min={1}
          step={1}
          className="w-48"
          disabled={isNA || isDontKnow}
        />
        <span className="text-xs font-medium">{value}</span>
        {allowNA && (
          <div className="flex items-center">
            <Checkbox
              id={`na-${category}`}
              checked={isNA}
              onCheckedChange={(checked) => onNAChange(checked as boolean)}
            />
            <label htmlFor={`na-${category}`} className="ml-1.5 text-xs font-medium">
              <span className="underline">N</span>/A
            </label>
          </div>
        )}
        {allowDontKnow && (
          <div className="flex items-center">
            <Checkbox
              id={`dk-${category}`}
              checked={isDontKnow}
              onCheckedChange={(checked) => onDontKnowChange(checked as boolean)}
            />
            <label htmlFor={`dk-${category}`} className="ml-1.5 text-xs font-medium">
              <span className="underline">D</span>/K
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

