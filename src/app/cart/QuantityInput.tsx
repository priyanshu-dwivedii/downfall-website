'use client';

import React, { useState, useEffect } from 'react';

interface QuantityInputProps {
  initialQuantity: number;
  onUpdate: (newQuantity: number) => void;
  className?: string;
  ariaLabel?: string;
}

export default function QuantityInput({ initialQuantity, onUpdate, className, ariaLabel }: QuantityInputProps) {
  const [localVal, setLocalVal] = useState<string>(initialQuantity.toString());

  useEffect(() => {
    setLocalVal(initialQuantity.toString());
  }, [initialQuantity]);

  const commit = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 1) {
      onUpdate(val);
      setLocalVal(val.toString());
    } else {
      setLocalVal(initialQuantity.toString());
    }
  };

  const handleBlur = () => {
    commit(localVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(localVal);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalVal(initialQuantity.toString());
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onFocus={(e) => e.target.select()}
      className={className}
      aria-label={ariaLabel}
      min="1"
    />
  );
}
