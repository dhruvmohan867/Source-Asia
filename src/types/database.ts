// ============================================================
// TypeScript Database Types — Auto-aligned with Supabase schema
// ============================================================
// WHY manual types over generated: Full control, cleaner DX,
// and we avoid the @supabase/supabase-js codegen dependency.
// In production, you'd use `supabase gen types typescript`.
// ============================================================

// ---------- Enums ----------
export type FlightStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'delayed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled';
export type SeatStatus = 'available' | 'locked' | 'booked';
export type SeatClass = 'economy' | 'business' | 'first';

// ---------- Database Row Types ----------

export interface Flight {
  id: string;
  flight_number: string;
  airline: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  status: FlightStatus;
  aircraft_type: string;
  total_seats: number;
  available_seats: number;
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  flight_id: string;
  seat_number: string;
  seat_class: SeatClass;
  status: SeatStatus;
  price_modifier: number;
  locked_by: string | null;
  locked_until: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  flight_id: string;
  pnr: string;
  status: BookingStatus;
  total_amount: number;
  passenger_count: number;
  booked_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Passenger {
  id: string;
  booking_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  passport_number: string | null;
  seat_number: string | null;
  created_at: string;
}

export interface BookingSeat {
  id: string;
  booking_id: string;
  seat_id: string;
  created_at: string;
}

export interface Reschedule {
  id: string;
  booking_id: string;
  old_flight_id: string;
  new_flight_id: string;
  price_difference: number;
  rescheduled_at: string;
}

// ---------- Composite/Joined Types ----------

export interface BookingWithFlight extends Booking {
  flight: Flight;
  passengers: Passenger[];
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

// ---------- RPC Response Types ----------

export interface RPCResponse<T = Record<string, unknown>> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface LockSeatResponse {
  success: boolean;
  error?: string;
  seat_id?: string;
  locked_until?: string;
}

export interface CreateBookingResponse {
  success: boolean;
  error?: string;
  booking_id?: string;
  pnr?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  error?: string;
  refund_amount?: number;
}

// ---------- Form Types ----------

export interface PassengerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
  nationality: string;
  dob: string;
}

// ---------- Supabase Database Type Map ----------
// WHY: Typed Supabase client for compile-time safety

export interface Database {
  public: {
    Tables: {
      flights: {
        Row: Flight;
        Insert: Omit<Flight, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Flight, 'id' | 'created_at'>>;
      };
      seats: {
        Row: Seat;
        Insert: Omit<Seat, 'id' | 'created_at'>;
        Update: Partial<Omit<Seat, 'id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      passengers: {
        Row: Passenger;
        Insert: Omit<Passenger, 'id' | 'created_at'>;
        Update: Partial<Omit<Passenger, 'id' | 'created_at'>>;
      };
      booking_seats: {
        Row: BookingSeat;
        Insert: Omit<BookingSeat, 'id' | 'created_at'>;
        Update: Partial<Omit<BookingSeat, 'id' | 'created_at'>>;
      };
      reschedules: {
        Row: Reschedule;
        Insert: Omit<Reschedule, 'id' | 'rescheduled_at'>;
        Update: Partial<Omit<Reschedule, 'id'>>;
      };
    };
    Functions: {
      lock_seat: {
  Args: { p_seat_id: string };
  Returns: LockSeatResponse;
};
      unlock_seat: {
  Args: { p_seat_id: string };
  Returns: RPCResponse;
};
      create_booking: {
        Args: {
          
          p_flight_id: string;
          p_seat_ids: string[];
          p_passengers: PassengerFormData[];
          
        };
        Returns: CreateBookingResponse;
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: CancelBookingResponse;
      };
      release_expired_locks: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
