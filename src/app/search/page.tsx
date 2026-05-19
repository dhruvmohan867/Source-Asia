// Search page — dedicated search route
import { SearchWidget } from '@/components/flights/search-widget';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Flights',
  description: 'Search for available flights across major Indian cities',
};

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Flights</h1>
        <p className="text-muted">Find the best flights across major Indian cities</p>
      </div>
      <SearchWidget />
    </div>
  );
}
