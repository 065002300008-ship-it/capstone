# Frontend

Frontend Next.js untuk project Capstone.

## Jalankan Lokal

```bat
npm run dev
```

Buka:

```text
http://localhost:3000
```

Secara default, request `/api/*` diproxy ke backend lokal:

```text
http://localhost:8000
```

Jika backend berjalan di URL lokal berbeda, buat `.env.local` dan isi:

```env
API_PROXY_TARGET=http://localhost:8000
```
