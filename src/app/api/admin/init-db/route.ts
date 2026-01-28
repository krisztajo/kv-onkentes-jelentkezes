export const runtime = 'edge';
// Adatbázis inicializálás API
// Ezt az endpointot hívd meg egyszer, hogy létrejöjjenek a táblák
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * POST /api/admin/init-db
 * Adatbázis táblák létrehozása
 * FONTOS: Ez csak egyszer kell, vagy ha újra akarod építeni az adatbázist
 */
export async function POST() {
  try {
    const { env } = getRequestContext();
    
    if (!env?.DB) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "DB binding nem található. Ellenőrizd a wrangler.toml fájlt." },
        { status: 500 }
      );
    }

    const db = env.DB;
    
    // Táblák létrehozása külön-külön (D1 batch-el)
    await db.batch([
      // Users table: registered users (both applicants and admins)
      db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin', 'superadmin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      
      // Periods table: training periods managed by admin
      db.prepare(`
        CREATE TABLE IF NOT EXISTS periods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          is_active INTEGER DEFAULT 0,
          start_date DATE,
          end_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      
      // Applications table: links users to periods with document uploads
      db.prepare(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          period_id INTEGER NOT NULL,
          cv_url TEXT,
          cv_uploaded_at DATETIME,
          recommendation_url TEXT,
          recommendation_uploaded_at DATETIME,
          recommendation_url_2 TEXT,
          recommendation_uploaded_at_2 DATETIME,
          motivation_letter TEXT,
          motivation_letter_char_count INTEGER,
          motivation_uploaded_at DATETIME,
          criminal_record_url TEXT,
          criminal_record_uploaded_at DATETIME,
          criminal_record_request_url TEXT,
          criminal_record_request_uploaded_at DATETIME,
          declarations JSON NULL,
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
          UNIQUE(user_id, period_id)
        )
      `),
      
      // Indexek létrehozása
      db.prepare("CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_applications_period_id ON applications(period_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_periods_is_active ON periods(is_active)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_periods_slug ON periods(slug)"),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Adatbázis sikeresen inicializálva!" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Adatbázis inicializálás sikertelen:", errorMessage);
    return NextResponse.json<ApiResponse>(
      { success: false, error: `Hiba történt: ${errorMessage}` },
      { status: 500 }
    );
  }
}
