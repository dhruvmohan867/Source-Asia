// ============================================================
// Homepage — Hero + Quick Search
// ============================================================
// WHY Server Component: No interactive state needed for the hero.
// The SearchWidget is a Client Component embedded within.
// This reduces the JS bundle for the landing page.
// ============================================================

import Link from "next/link";
import { SearchWidget } from "@/components/flights/search-widget";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-purple-500/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Real-time seat booking
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Fly with </span>
              <span className="gradient-text">Source Asia</span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto">
              Search, book, and manage your flights with real-time seat
              selection. Modern aviation experience at your fingertips.
            </p>
          </div>

          {/* Search Widget */}
          <div
            className="max-w-4xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Why Source Asia?
          </h2>
          <p className="text-muted max-w-xl mx-auto">
            Built with modern technology for a seamless booking experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-surface border border-border p-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-3xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-accent/10 via-purple-500/10 to-accent/10 border border-accent/20 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to book?
          </h2>
          <p className="text-muted mb-6 max-w-md mx-auto">
            {user
              ? "Manage your bookings, track reservations, and enjoy real-time updates."
              : "Create an account to save your bookings, manage reservations, and get real-time updates."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
            >
              Search Flights
            </Link>
            {user ? (
              <Link
                href="/bookings"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-surface border border-border text-foreground font-medium hover:bg-surface-hover transition-colors"
              >
                My Bookings
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-surface border border-border text-foreground font-medium hover:bg-surface-hover transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: "🔍",
    title: "Smart Search",
    description:
      "Search flights by origin, destination, date, and passenger count with instant results.",
  },
  {
    icon: "💺",
    title: "Real-Time Seats",
    description:
      "Interactive seat map with live availability. See seat status change in real-time.",
  },
  {
    icon: "📱",
    title: "PWA Ready",
    description:
      "Install as an app, view bookings offline, and get a native-like experience on any device.",
  },
];
