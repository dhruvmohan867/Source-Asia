import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">✈️</div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted mb-6">This page has departed. Let&apos;s get you back on track.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
