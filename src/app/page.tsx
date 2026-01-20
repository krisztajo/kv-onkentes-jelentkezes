import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getActivePeriod } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import type { User, Period } from "@/types";

export const runtime = "edge";

export default async function HomePage() {
  let user: User | null = null;
  let activePeriod: Period | null = null;

  try {
    user = await getSession();
    activePeriod = await getActivePeriod();
  } catch (error) {
    // Database not available in development mode
    console.error("Database not available:", error);
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 bg-hero-pattern" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-surface-900 mb-6 animate-fade-in">
                Önkéntes <span className="text-gradient">Képzési</span>{" "}
                Jelentkezés
              </h1>
              <p
                className="text-lg sm:text-xl text-surface-600 mb-10 animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                Csatlakozz önkéntes közösségünkhöz! Töltsd fel a jelentkezéshez szükséges dokumentumokat!
              </p>

              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                {activePeriod ? (
                  <Link href={user ? `/apply?period=${activePeriod.slug}` : `/register?period=${activePeriod.slug}`}>
                    <Button variant="primary" size="lg">
                      {user ? 'Folytatás' : 'Jelentkezés'} ({activePeriod.name})
                    </Button>
                  </Link>
                ) : (
                  <div className="text-surface-500">
                    Jelenleg nincs aktív jelentkezési időszak
                  </div>
                )}

                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <Link href="/admin">
                    <Button variant="secondary" size="lg">
                      Admin felület
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-center text-surface-900 mb-12">
              Jelentkezési folyamat
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div
                className="card p-8 text-center animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-3">
                  1. Regisztráció
                </h3>
                <p className="text-surface-600">
                  Hozd létre fiókod az email címeddel és jelszavaddal
                </p>
              </div>

              <div
                className="card p-8 text-center animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-accent-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-3">
                  2. Dokumentumok
                </h3>
                <p className="text-surface-600">
                  Töltsd fel az önéletrajzod, motivációs leveled és egyéb
                  dokumentumokat
                </p>
              </div>

              <div
                className="card p-8 text-center animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-3">
                  3. Beküldés
                </h3>
                <p className="text-surface-600">
                  Ellenőrizd és küldd be a jelentkezésedet elbírálásra
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-center text-surface-900 mb-4">
              Szükséges dokumentumok
            </h2>
            <p className="text-center text-surface-600 mb-12 max-w-2xl mx-auto">
              A jelentkezéshez az alábbi dokumentumok feltöltése szükséges.
              Minden dokumentum PDF vagy képfájl formátumban tölthető fel.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-elevated p-6">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-surface-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">
                  Önéletrajz (CV)
                </h3>
                <p className="text-sm text-surface-500">
                  Részletes szakmai és tanulmányi háttér
                </p>
              </div>

              <div className="card-elevated p-6">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-surface-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">
                  2 Ajánlólevél
                </h3>
                <p className="text-sm text-surface-500">
                  Sablon letölthető az űrlapon
                </p>
              </div>

              <div className="card-elevated p-6">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-surface-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">
                  Motivációs levél
                </h3>
                <p className="text-sm text-surface-500">
                  1000-2500 karakter terjedelmű szöveg
                </p>
              </div>

              <div className="card-elevated p-6">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-surface-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">
                  Erkölcsi bizonyítvány
                </h3>
                <p className="text-sm text-surface-500">
                  Hatósági erkölcsi bizonyítvány másolata
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-surface-500 text-sm">
          © 2026 Önkéntes Jelentkezési Rendszer
        </div>
      </footer>
    </div>
  );
}
