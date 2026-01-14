# Önkéntes Jelentkezési Rendszer

Next.js 15 alapú webalkalmazás önkéntesképzési jelentkezések kezelésére, Cloudflare Workers és D1 adatbázis támogatással.

## Funkciók

### Admin felület
- Képzési időszakok létrehozása és kezelése
- Aktív időszak kijelölése
- Egyedi jelentkezési linkek generálása
- Jelentkezők listázása időszak szerint
- Dokumentumok megtekintése (egy kattintással)
- Checklist a feltöltött dokumentumokról

### Jelentkezési felület
- Regisztráció és bejelentkezés
- Dokumentum feltöltés (4 típus):
  - Önéletrajz (CV)
  - Ajánlólevél (sablon letöltéssel)
  - Motivációs levél (1000-2500 karakter)
  - Erkölcsi bizonyítvány
- Feltöltési státusz megjelenítése
- PDF és képfájlok támogatása

## Technológiák

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Adatbázis**: Cloudflare D1 (SQLite)
- **Fájltárolás**: Cloudflare R2
- **Autentikáció**: JWT (jose)
- **Validáció**: Zod

## Telepítés

### Előfeltételek

- Node.js 18+
- npm vagy yarn
- Cloudflare fiók (Workers, D1, R2)
- Wrangler CLI

### Lokális fejlesztés

1. **Projekt klónozása és függőségek telepítése:**

```bash
npm install
```

2. **D1 adatbázis létrehozása lokálisan:**

```bash
npm run db:migrate:local
```

3. **Fejlesztői szerver indítása:**

```bash
npm run dev
```

4. **Cloudflare preview (opcionális):**

```bash
npm run preview
```

### Cloudflare beállítások

1. **D1 adatbázis létrehozása:**

```bash
wrangler d1 create volunteer-db
```

2. **R2 bucket létrehozása:**

```bash
wrangler r2 bucket create volunteer-uploads
```

3. **wrangler.toml frissítése:**

Cseréld ki a `database_id`-t a létrehozott D1 adatbázis azonosítójára.

4. **Migráció futtatása production-ben:**

```bash
npm run db:migrate:prod
```

5. **Deploy:**

```bash
npm run deploy
```

## Környezeti változók

A `wrangler.toml` fájlban állítsd be:

```toml
[vars]
JWT_SECRET = "erős-titkos-kulcs"
NEXT_PUBLIC_APP_URL = "https://your-domain.workers.dev"
```

## Adatbázis séma

### Users tábla
- `id`: Egyedi azonosító
- `email`: Email cím (egyedi)
- `password_hash`: Jelszó hash
- `name`: Teljes név
- `role`: Szerepkör (applicant/admin)
- `created_at`, `updated_at`: Időbélyegek

### Periods tábla
- `id`: Egyedi azonosító
- `name`: Időszak neve (pl. "2026/1")
- `slug`: URL-barát azonosító (pl. "2026-1")
- `is_active`: Aktív-e az időszak
- `start_date`, `end_date`: Időszak határai

### Applications tábla
- `id`: Egyedi azonosító
- `user_id`: Felhasználó hivatkozás
- `period_id`: Időszak hivatkozás
- `cv_url`: Önéletrajz URL
- `recommendation_url`: Ajánlólevél URL
- `motivation_letter`: Motivációs levél szövege
- `motivation_letter_char_count`: Karakterszám
- `criminal_record_url`: Erkölcsi bizonyítvány URL
- `status`: Jelentkezés állapota

## API végpontok

### Autentikáció
- `POST /api/auth/register` - Regisztráció
- `POST /api/auth/login` - Bejelentkezés
- `POST /api/auth/logout` - Kijelentkezés
- `GET /api/auth/me` - Aktuális felhasználó

### Időszakok (Admin)
- `GET /api/periods` - Összes időszak
- `POST /api/periods` - Új időszak létrehozása
- `PATCH /api/periods/:id` - Időszak frissítése
- `DELETE /api/periods/:id` - Időszak törlése

### Jelentkezések
- `GET /api/applications` - Jelentkezések listázása (Admin)
- `GET /api/applications/my` - Saját jelentkezés
- `POST /api/applications` - Jelentkezés létrehozása

### Fájlkezelés
- `POST /api/upload` - Dokumentum feltöltése
- `GET /api/files/:path` - Fájl letöltése

## Használat

### Admin workflow

1. Bejelentkezés admin fiókkal
2. Új időszak létrehozása (pl. "2026/1")
3. Időszak aktiválása
4. Jelentkezési link másolása és megosztása
5. Jelentkezők dokumentumainak megtekintése

### Jelentkező workflow

1. Kattintás a jelentkezési linkre
2. Regisztráció email és jelszóval
3. Dokumentumok feltöltése
4. Motivációs levél megírása (1000-2500 karakter)
5. Státusz ellenőrzése

## Alapértelmezett admin fiók

- **Email**: admin@example.com
- **Jelszó**: admin123

⚠️ **Fontos**: Production környezetben változtasd meg a jelszót!

## Fejlesztési tippek

1. **Lokális D1 teszt:**
```bash
wrangler d1 execute volunteer-db --local --command "SELECT * FROM users"
```

2. **Build ellenőrzése:**
```bash
npm run build:cloudflare
```

3. **Típus ellenőrzés:**
```bash
npx tsc --noEmit
```

## Licenc

MIT
