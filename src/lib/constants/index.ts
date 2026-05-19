// ============================================================
// Application Constants
// ============================================================

export const APP_NAME = 'Source Asia';
export const APP_DESCRIPTION = 'Modern flight management and booking platform';

/** Airport codes and names for search dropdowns */
export const AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Intl', city: 'Mumbai' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bangalore' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose Intl', city: 'Kolkata' },
] as const;

/** Seat class configuration */
export const SEAT_CLASSES = {
  first: { label: 'First Class', color: '#f59e0b', icon: '👑' },
  business: { label: 'Business', color: '#6366f1', icon: '💼' },
  economy: { label: 'Economy', color: '#10b981', icon: '✈️' },
} as const;

/** Seat map configuration — A320 layout */
export const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const AISLE_AFTER = 'C'; // Aisle between C and D

/** Booking constraints */
export const MIN_CANCELLATION_HOURS = 2;
export const SEAT_LOCK_MINUTES = 5;
export const MAX_PASSENGERS = 9;

/** Route paths */
export const ROUTES = {
  home: '/',
  search: '/search',
  flights: '/flights',
  booking: '/booking',
  bookings: '/bookings',
  profile: '/profile',
  login: '/login',
  register: '/register',
} as const;
