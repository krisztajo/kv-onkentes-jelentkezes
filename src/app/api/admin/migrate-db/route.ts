export const runtime = 'edge';
// Adatbázis migráció API - meglévő séma frissítése
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * POST /api/admin/migrate-db
 * Meglévő adatbázis séma frissítése új oszlopokkal/táblákkal
 */
export async function POST() {
  try {
    const { env } = getRequestContext();
    
    if (!env?.DB) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "DB binding nem található." },
        { status: 500 }
      );
    }

    const db = env.DB;
    const migrations: string[] = [];

    // 1. Ellenőrizzük, hogy létezik-e a users tábla
    const usersTableExists = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .first();

    if (!usersTableExists) {
      await db.prepare(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin', 'superadmin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      migrations.push("users tábla létrehozva");
    }

    // 2. Ellenőrizzük, hogy létezik-e a periods tábla
    const periodsTableExists = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='periods'")
      .first();

    if (!periodsTableExists) {
      await db.prepare(`
        CREATE TABLE periods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          is_active INTEGER DEFAULT 0,
          start_date DATE,
          end_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      migrations.push("periods tábla létrehozva");
    }

    // 3. Ellenőrizzük, hogy létezik-e az applications tábla
    const applicationsTableExists = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='applications'")
      .first();

    if (!applicationsTableExists) {
      await db.prepare(`
        CREATE TABLE applications (
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
      `).run();
      migrations.push("applications tábla létrehozva");
    } else {
      // Ha a tábla létezik, ellenőrizzük a hiányzó oszlopokat
      const applicationsColumns = await db
        .prepare("PRAGMA table_info(applications)")
        .all<{ name: string }>();
      
      const columnNames = applicationsColumns.results?.map(col => col.name) || [];

      // 0002: recommendation_url_2 és criminal_record_request_url
      if (!columnNames.includes("recommendation_url_2")) {
        await db.prepare("ALTER TABLE applications ADD COLUMN recommendation_url_2 TEXT").run();
        migrations.push("recommendation_url_2 oszlop hozzáadva");
      }
      if (!columnNames.includes("recommendation_uploaded_at_2")) {
        await db.prepare("ALTER TABLE applications ADD COLUMN recommendation_uploaded_at_2 DATETIME").run();
        migrations.push("recommendation_uploaded_at_2 oszlop hozzáadva");
      }
      if (!columnNames.includes("criminal_record_request_url")) {
        await db.prepare("ALTER TABLE applications ADD COLUMN criminal_record_request_url TEXT").run();
        migrations.push("criminal_record_request_url oszlop hozzáadva");
      }
      if (!columnNames.includes("criminal_record_request_uploaded_at")) {
        await db.prepare("ALTER TABLE applications ADD COLUMN criminal_record_request_uploaded_at DATETIME").run();
        migrations.push("criminal_record_request_uploaded_at oszlop hozzáadva");
      }

      // 0003: declarations JSON
      if (!columnNames.includes("declarations")) {
        await db.prepare("ALTER TABLE applications ADD COLUMN declarations JSON NULL").run();
        migrations.push("declarations oszlop hozzáadva");
      }
    }

    // 4. Ellenőrizzük az indexeket
    const indexes = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='index'")
      .all<{ name: string }>();
    
    const indexNames = indexes.results?.map(idx => idx.name) || [];

    if (!indexNames.includes("idx_applications_user_id")) {
      await db.prepare("CREATE INDEX idx_applications_user_id ON applications(user_id)").run();
      migrations.push("idx_applications_user_id index létrehozva");
    }
    if (!indexNames.includes("idx_applications_period_id")) {
      await db.prepare("CREATE INDEX idx_applications_period_id ON applications(period_id)").run();
      migrations.push("idx_applications_period_id index létrehozva");
    }
    if (!indexNames.includes("idx_applications_status")) {
      await db.prepare("CREATE INDEX idx_applications_status ON applications(status)").run();
      migrations.push("idx_applications_status index létrehozva");
    }
    if (!indexNames.includes("idx_periods_is_active")) {
      await db.prepare("CREATE INDEX idx_periods_is_active ON periods(is_active)").run();
      migrations.push("idx_periods_is_active index létrehozva");
    }
    if (!indexNames.includes("idx_periods_slug")) {
      await db.prepare("CREATE INDEX idx_periods_slug ON periods(slug)").run();
      migrations.push("idx_periods_slug index létrehozva");
    }

    if (migrations.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { 
          message: "Az adatbázis már naprakész, nincs szükség migrációra.",
          migrations: []
        },
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        message: "Adatbázis sikeresen frissítve!",
        migrations 
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Adatbázis migráció sikertelen:", errorMessage);
    return NextResponse.json<ApiResponse>(
      { success: false, error: `Hiba történt: ${errorMessage}` },
      { status: 500 }
    );
  }
}
