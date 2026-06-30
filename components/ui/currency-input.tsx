"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/imoveis/currency-input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  "aria-invalid": ariaInvalid,
  className,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => formatCurrencyInput(value));

  useEffect(() => {
    const parsed = parseCurrencyInput(display);
    if (parsed !== value) {
      setDisplay(formatCurrencyInput(value));
    }
  }, [value, display]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrencyInput(event.target.value);
    setDisplay(formatted);
    onChange(parseCurrencyInput(formatted));
  }

  function handleBlur() {
    setDisplay(formatCurrencyInput(value));
  }

  return (
    <Input
      id={id}
      inputMode="decimal"
      type="text"
      autoComplete="off"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={cn(className)}
    />
  );
}
