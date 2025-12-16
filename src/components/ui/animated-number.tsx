"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ 
  value, 
  format, 
  className,
  duration = 1.5 
}: AnimatedNumberProps) {
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    duration 
  });
  
  const display = useTransform(spring, (current) =>
    format ? format(Math.round(current)) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

// Currency-specific animated number
interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  locale?: string;
  className?: string;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  currency = "ILS",
  locale = "he-IL",
  className,
  showSign = false,
}: AnimatedCurrencyProps) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    signDisplay: showSign ? "exceptZero" : "auto",
  });

  return (
    <AnimatedNumber
      value={value}
      format={(n) => formatter.format(n)}
      className={className}
    />
  );
}

// Percentage animated number
interface AnimatedPercentageProps {
  value: number;
  className?: string;
  decimals?: number;
  showSign?: boolean;
}

export function AnimatedPercentage({
  value,
  className,
  decimals = 1,
  showSign = true,
}: AnimatedPercentageProps) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  
  const display = useTransform(spring, (current) => {
    const formatted = current.toFixed(decimals);
    const sign = showSign && current > 0 ? "+" : "";
    return `${sign}${formatted}%`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

