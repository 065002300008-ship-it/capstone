# Capstone Project

Project ini dikonfigurasi untuk berjalan di localhost.

## Backend

Jalankan dari folder root project:

```bat
venv\Scripts\activate.bat
uvicorn main:app --reload
```

Backend berjalan di:

```text
http://localhost:8000
```

Default database lokal:

```env
DATABASE_URL=mysql+pymysql://root@localhost/mixindo_db
```

## Frontend

Jalankan dari folder `frontend`:

```bat
npm run dev
```

Frontend berjalan di:

```text
http://localhost:3000
```

Saat `NEXT_PUBLIC_API_BASE` tidak di-set, request `/api/*` otomatis diproxy ke `http://localhost:8000`.
