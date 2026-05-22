// ============================================================
// Passenger Details Page (Booking Step 2)
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/stores/booking-store';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { passengerSchema } from '@/lib/validators';
import type { PassengerFormData } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import error from '@/app/error';

export default function PassengersPage() {
  const router = useRouter();
  const { selectedFlight, selectedSeats, totalAmount, setPassengerFormData, setBooking, setBookingError } = useBookingStore();
  const userId = useAuthStore((s) => s.user?.id);

 const [forms, setForms] = useState<PassengerFormData[]>(
  selectedSeats.map(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    passportNumber: '',
    nationality: '',
    dob: '',
  }))
);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedFlight || selectedSeats.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted mb-4">No seats selected</p>
        <Link href="/search" className="text-accent hover:underline">
          Search for flights
        </Link>
      </div>
    );
  }

  const updateForm = (index: number, field: keyof PassengerFormData, value: string) => {
    setForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear error on change
    setErrors((prev) => {
      const updated = { ...prev };
      if (updated[index]) {
        delete updated[index][field];
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all passenger forms
    const newErrors: Record<string, Record<string, string>> = {};
    let hasErrors = false;

    forms.forEach((form, index) => {
      const result = passengerSchema.safeParse(form);
      if (!result.success) {
        newErrors[index] = {};
        result.error.issues.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[index][field] = err.message;
        });
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    if (!userId) {
      toast.error('Please sign in to complete booking');
      return;
    }

    setIsSubmitting(true);
    setBooking(true);
    setBookingError(null);

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const { data, error } = await supabase.rpc('create_booking', {
  
  p_flight_id: String(selectedFlight.id),
  p_seat_ids: selectedSeats.map((s) => String(s.id)),
  p_passengers: JSON.stringify(forms),
  
});

console.log('BOOKING DATA:', data);
console.log('BOOKING ERROR:', error);
      const result = data as { success: boolean; error?: string; pnr?: string; booking_id?: string };

      if (!result?.success) {
        throw new Error(result?.error ?? 'Booking failed');
      }

      setPassengerFormData(forms);
      toast.success('Booking confirmed!');
      router.push(`/booking/confirmation?pnr=${result.pnr}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Booking failed';
      setBookingError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setBooking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/booking/seats?flightId=${selectedFlight.id}&passengers=${selectedSeats.length}`} className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to seats
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Passenger Details</h1>
      <p className="text-muted text-sm mb-8">Fill in details for each passenger</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {forms.map((form, index) => (
          <div key={index} className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Passenger {index + 1} — Seat {selectedSeats[index]?.seat_number}
              </h3>
              <span className="text-xs text-muted capitalize">
                {selectedSeats[index]?.seat_class} class
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id={`firstName-${index}`}
                label="First Name"
                placeholder="Dhruv"
                value={form.firstName}
                onChange={(e) => updateForm(index, 'firstName', e.target.value)}
                error={errors[index]?.firstName}
                required
              />
              <Input
                id={`lastName-${index}`}
                label="Last Name"
                placeholder="Mohan Shukla"
                value={form.lastName}
                onChange={(e) => updateForm(index, 'lastName', e.target.value)}
                error={errors[index]?.lastName}
                required
              />
              <Input
                id={`email-${index}`}
                label="Email"
                type="email"
                placeholder="sample@example.com"
                value={form.email}
                onChange={(e) => updateForm(index, 'email', e.target.value)}
                error={errors[index]?.email}
                required
              />
              <Input
                id={`phone-${index}`}
                label="Phone"
                type="tel"
                placeholder="+91 98********"
                value={form.phone}
                onChange={(e) => updateForm(index, 'phone', e.target.value)}
                error={errors[index]?.phone}
                required
              />
              <Input
                id={`passport-${index}`}
                label="Passport Number (Optional)"
                placeholder="A1234567"
                value={form.passportNumber}
                onChange={(e) => updateForm(index, 'passportNumber', e.target.value)}
              />
              <Input
  id={`nationality-${index}`}
  label="Nationality"
  placeholder="Indian"
  value={form.nationality}
  onChange={(e) =>
    updateForm(
      index,
      'nationality',
      e.target.value
    )
  }
  error={errors[index]?.nationality}
  required
/>

<Input
  id={`dob-${index}`}
  label="Date of Birth"
  type="date"
  value={form.dob}
  onChange={(e) =>
    updateForm(
      index,
      'dob',
      e.target.value
    )
  }
  error={errors[index]?.dob}
  required
/>
            </div>
          </div>
        ))}

        {/* Summary & Submit */}
        <div className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="font-semibold mb-4">Booking Summary</h3>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-muted">Flight</span>
              <span>{selectedFlight.flight_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Route</span>
              <span>{selectedFlight.origin} → {selectedFlight.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Seats</span>
              <span>{selectedSeats.map((s) => s.seat_number).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Passengers</span>
              <span>{selectedSeats.length}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            {isSubmitting ? 'Confirming Booking...' : 'Confirm & Book'}
          </Button>
        </div>
      </form>
    </div>
  );
}
