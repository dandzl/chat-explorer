import React, { useState, useEffect, useRef } from 'react';
import { SliderControl } from './slider-control';
import { TextInputControl } from './text-input-control';
import { MultiSelectButtonControl } from './multi-select-button-control';
import { Button } from "@/components/ui/button";

interface FocusedLabelCategoryProps {
  category: string;
  options: Record<string, { shortcut: string | null }> | number[] | { maxLength?: number; minLength?: number };
  selectionType: 'multi-select-button' | 'slider' | 'text-input';
  maxSelection?: number;
  minSelection?: number;
  allowNA?: boolean;
  allowDontKnow?: boolean;
  onSelectionConfirmed: (category: string, selection: string[] | number | string) => void;
  onMoveToPrevious: () => void;
  isFocused: boolean;
  value?: string[] | number | string;
}

export function FocusedLabelCategory({
  category,
  options,
  selectionType,
  maxSelection,
  minSelection,
  allowNA,
  allowDontKnow,
  onSelectionConfirmed,
  onMoveToPrevious,
  isFocused,
  value
}: FocusedLabelCategoryProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(typeof value === 'number' ? value : 3);
  const [isNA, setIsNA] = useState(value === 'N/A');
  const [isDontKnow, setIsDontKnow] = useState(value === 'D/K');
  const [textValue, setTextValue] = useState(typeof value === 'string' ? value : '');
  const [showError, setShowError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isFocused || selectionType !== 'multi-select-button') return;
    
      const pressedKey = event.key.toUpperCase();
      const option = Object.entries(options as Record<string, { shortcut: string | null }>).find(
        ([_, value]) => value.shortcut?.toUpperCase() === pressedKey
      );
      if (option) {
        setSelected(prev => {
          const newSelected = prev.includes(option[0])
            ? prev.filter(item => item !== option[0])
            : [...prev, option[0]].slice(-maxSelection);
          return newSelected;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFocused, selectionType, options, maxSelection]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isFocused || selectionType !== 'slider') return;
      
      if (event.key === 'j') {
        setSliderValue(prev => Math.max(1, prev - 1));
      } else if (event.key === 'k') {
        setSliderValue(prev => Math.min(5, prev + 1));
      } else if (event.key === 'n' && allowNA) {
        setIsNA(prev => !prev);
      } else if (event.key === 'd' && allowDontKnow) {
        setIsDontKnow(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFocused, selectionType, allowNA, allowDontKnow]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (isFocused && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      if (selectionType === 'text-input' && textInputRef.current) {
        textInputRef.current.focus();
      } else if (containerRef.current) {
        containerRef.current.focus();
      }
    }
  }, [isFocused, selectionType]);

  useEffect(() => {
    if (Array.isArray(value)) {
      setSelected(value);
    } else if (typeof value === 'number') {
      setSliderValue(value);
    } else if (value === 'N/A') {
      setIsNA(true);
    } else if (value === 'D/K') {
      setIsDontKnow(true);
    } else if (typeof value === 'string') {
      setTextValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (isFocused && selectionType === 'multi-select-button' && (!value || (Array.isArray(value) && value.length === 0))) {
      setSelected([]);
    }
  }, [isFocused, selectionType, value]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isFocused && event.key === 'Enter') {
      event.preventDefault();
      if (event.altKey || event.metaKey) {
        // Prevent default behavior for Option+Enter (Mac) or Alt+Enter (Windows)
        return;
      }
      if (event.shiftKey) {
        onMoveToPrevious();
      } else {
        if (selectionType === 'multi-select-button') {
          if (selected.length >= (minSelection || 0)) {
            onSelectionConfirmed(category, selected);
          } else {
            setShowError(true);
          }
        } else if (selectionType === 'slider') {
          onSelectionConfirmed(category, isNA ? 'N/A' : isDontKnow ? 'D/K' : sliderValue);
        } else if (selectionType === 'text-input') {
          if (textValue.length >= (typeof options === 'object' && 'minLength' in options ? options.minLength || 10 : 10)) {
            onSelectionConfirmed(category, textValue);
          }
        }
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={isFocused ? 0 : -1}
      className={`mb-3 p-2 rounded ${isFocused ? 'bg-blue-100 outline-none ring-2 ring-blue-300' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {selectionType === 'multi-select-button' && (
        <>
          <MultiSelectButtonControl
            category={category}
            options={options as Record<string, { shortcut: string | null }>}
            maxSelection={maxSelection || 1}
            minSelection={minSelection || 0}
            selected={selected}
            onSelectionChange={(newSelected) => {
              setSelected(newSelected);
              setShowError(false);
            }}
            isFocused={isFocused}
          />
          {showError && (
            <p className="text-xs text-red-500 mt-1.5">Please select at least {minSelection} option(s)</p>
          )}
        </>
      )}
      {selectionType === 'slider' && (
        <SliderControl
          category={category}
          value={sliderValue}
          onChange={setSliderValue}
          allowNA={allowNA}
          isNA={isNA}
          onNAChange={setIsNA}
          allowDontKnow={allowDontKnow}
          isDontKnow={isDontKnow}
          onDontKnowChange={setIsDontKnow}
          disabled={isNA || isDontKnow}
        />
      )}
      {selectionType === 'text-input' && (
        <div className="space-y-2">
          <TextInputControl
            ref={textInputRef}
            category={category}
            value={textValue}
            onChange={setTextValue}
            maxLength={typeof options === 'object' && 'maxLength' in options ? options.maxLength || 400 : 400}
            minLength={typeof options === 'object' && 'minLength' in options ? options.minLength || 10 : 10}
          />
          <Button 
            onClick={() => onSelectionConfirmed(category, textValue)}
            disabled={textValue.length < (typeof options === 'object' && 'minLength' in options ? options.minLength || 10 : 10)}
          >
            Submit
          </Button>
        </div>
      )}
      {isFocused && (
        <p className="text-xs text-gray-600 mt-1.5">
          {selectionType === 'slider' && (
            <>
              Press 'j' to decrease, 'k' to increase,
              Enter to confirm, Shift + Enter for back
            </>
          )}
          {selectionType === 'text-input' && (
            <>
              Enter to submit, Shift + Enter for back
            </>
          )}
          {selectionType === 'multi-select-button' && (
            <>
              Enter to confirm, Shift + Enter for back
            </>
          )}
        </p>
      )}
    </div>
  );
}

