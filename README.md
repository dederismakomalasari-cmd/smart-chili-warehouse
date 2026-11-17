# Smart Chili Warehouse — Next.js + PostgreSQL + YOLO11

Starter full-stack untuk melanjutkan prototype Smart Chili Warehouse.

## Stack
- Next.js App Router + TypeScript
- PostgreSQL 16 + Prisma ORM
- Tailwind CSS + Recharts
- Python FastAPI + Ultralytics YOLO11 untuk inference
- REST endpoint untuk telemetry sensor, alert, lot, dan inference gambar

## A. Prasyarat
- Node.js 20.9+
- Docker Desktop (untuk PostgreSQL) atau PostgreSQL lokal
- Python 3.10–3.12 untuk YOLO service
- Model `best.pt` dari training dataset yang diberikan

## B. Jalankan database
Dari root project:
```bash
docker compose up -d
```
Salin `.env.example` menjadi `.env`, lalu pastikan DATABASE_URL sesuai.

## C. Jalankan Next.js
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
Buka http://localhost:3000. Untuk halaman webcam YOLO11, buka http://localhost:3000/sorting.
Biarkan proses Next.js tetap berjalan di terminal ini.

## D. Jalankan YOLO11 service
```bash
cd yolo-service
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```
Berat model tersedia pada `yolo-service/weights/best.pt`. Endpoint health: http://localhost:8001/health
Jalankan service ini di terminal kedua. http://localhost:8001/docs adalah Swagger untuk menguji API secara langsung, bukan halaman webcam aplikasi.

Di `.env`, `YOLO_SERVICE_URL=http://127.0.0.1:8001`.

## E. Endpoint API
- `GET /api/health`
- `POST /api/sensors` — simpan telemetry, evaluasi rule, catat alert dan log aktuator simulasi
- `GET /api/sensors?room=COLD_A&take=50`
- `GET /api/alerts`
- `GET /api/lots`
- `POST /api/lots`
- `POST /api/ai/infer` — multipart form field `image`, diteruskan ke FastAPI `/predict`

Contoh payload sensor:
```json
{
  "deviceId": "ESP32-COLD-A",
  "room": "COLD_A",
  "temperature": 8.1,
  "humidity": 86,
  "co2": 920,
  "ethylene": 0.4,
  "oxygen": 20.8,
  "pressurePa": 8,
  "doorOpen": false,
  "powerKw": 2.1,
  "energyKwh": 1.7
}
```

## F. Integrasi model
`best.pt` berasal dari arsip dataset pengguna, hasil training YOLO11n 50 epoch. Kelas:
- ID 0: Cabai Busuk 10-
- ID 1: Cabai Busuk 5-
- ID 2: Cabai Segar

Service YOLO mengembalikan bounding box, class ID/nama, dan confidence. Next.js meneruskan hasil melalui `/api/ai/infer`.

## Catatan desain dan batasan
1. Pembacaan sensor dari seed adalah dummy, bukan perangkat nyata.
2. Rule engine mengimplementasikan ambang konsep yang tercantum di laporan: suhu >10°C chiller ON; suhu <7°C OFF; RH <80% humidifier ON; CO2 >1.500 ppm exhaust; CO2 >3.000 ppm ventilasi penuh dan buzzer; etilen >1 ppm; O2 <19,5%; tekanan di luar +5 sampai +15 Pa; pintu terbuka memunculkan event.
3. Durasi pintu >3 menit membutuhkan mekanisme timer/event berkelanjutan; starter ini baru merekam status pintu terbuka.
4. Log aktuator saat ini hanya simulasi database. Jangan hubungkan ke relay fisik sebelum ada fail-safe, validasi hardware, autentikasi perangkat, dan pengujian.
5. Kelas dataset YOLO (segar/busuk) tidak sama dengan Grade A/B/C pada SOP. Mapping harus ditetapkan tim QC; tidak ada mapping otomatis dalam starter ini.
6. WhatsApp AI disiapkan sebagai halaman konsep saja. Integrasi WhatsApp Business webhook belum diimplementasikan.
7. Dataset arsip tidak memiliki split test terpisah. Lakukan evaluasi tambahan sebelum pemakaian operasional.
