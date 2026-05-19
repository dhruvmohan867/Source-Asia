// Offline page
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
        <p className="text-muted mb-6 max-w-md">
          It looks like you&apos;ve lost your internet connection. Some features may not be available.
        </p>
        <Link
          href="/bookings"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
        >
          View Cached Bookings
        </Link>
      </div>
    </div>
  );
}
