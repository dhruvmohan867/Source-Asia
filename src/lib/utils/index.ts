// ============================================================
// Utility Functions
// ============================================================

import { clsx, type ClassValue } from 'clsx';

/** Merge Tailwind classes safely — prevents conflicts */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format price in INR */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/** Format time for display */
export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr));
}

/** Calculate flight duration in hours and minutes */
export function calculateDuration(departure: string, arrival: string): string {
  const diff = new Date(arrival).getTime() - new Date(departure).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/** Generate a readable time range */
export function formatTimeRange(departure: string, arrival: string): string {
  return `${formatTime(departure)} → ${formatTime(arrival)}`;
}

/** Check if a flight departure is within N hours */
export function isWithinHours(departureTime: string, hours: number): boolean {
  const departure = new Date(departureTime).getTime();
  const now = Date.now();
  const threshold = hours * 60 * 60 * 1000;
  return departure - now <= threshold;
}

/** Get seat class badge color */
export function getSeatClassColor(seatClass: string): string {
  switch (seatClass) {
    case 'first':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'business':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'economy':
    default:
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
}

/** Get booking status badge color */
export function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'rescheduled':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
}
