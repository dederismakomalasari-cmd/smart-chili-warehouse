import { Frame } from "@/components/frame";
import { prisma } from "@/lib/prisma";
import { Thermometer,Weight,ScanLine,AlertTriangle } from "lucide-react";
import { TrendChart } from "@/components/trend-chart";
export const dynamic="force-dynamic";
export default async function Home(){
 const [latest,lotCount,activeAlerts,latestReadings]=await Promise.all([
  prisma.sensorReading.findFirst({where:{room:"COLD_A"},orderBy:{recordedAt:"desc"}}),
  prisma.lot.count({where:{status:{in:["RECEIVED","SORTED","STORED"]}}}),
  prisma.alert.count({where:{status:"ACTIVE"}}),
  prisma.sensorReading.findMany({where:{room:"COLD_A"},orderBy:{recordedAt:"desc"},take:12})
 ]);
 const fmt=(n:number|undefined|null,s="")=>n==null?"—":`${n}${s}`;
 const data=latestReadings.reverse().map(r=>({time:r.recordedAt.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),temperature:r.temperature??0,humidity:r.humidity??0}));
 return <Frame title="Dashboard"><div className="pagehead"><div><div className="eyebrow">Operational overview</div><h1>Dashboard Gudang Pintar</h1><div className="sub">Pantau kualitas cabai, kondisi ruang simpan, dan aktivitas sortasi.</div></div><span className="status">PostgreSQL connected</span></div>
 <div className="grid kpis">
  <div className="card"><div className="kpi-label">Suhu Cold Storage A</div><div className="kpi-value">{fmt(latest?.temperature," °C")}</div><div className="muted">Target 7–10 °C</div></div>
  <div className="card"><div className="kpi-label">Kelembapan Cold A</div><div className="kpi-value">{fmt(latest?.humidity," %")}</div><div className="muted">Target 80–90% RH</div></div>
  <div className="card"><div className="kpi-label">Lot aktif</div><div className="kpi-value">{lotCount}</div><div className="muted">Data inventaris tersimpan</div></div>
  <div className="card"><div className="kpi-label">Peringatan aktif</div><div className="kpi-value">{activeAlerts}</div><div className="muted">Perlu ditinjau operator</div></div>
 </div>
 <div className="grid two">
  <div className="card"><h3 className="card-title">Tren suhu & kelembapan · Cold A</h3><div className="chartbox"><TrendChart data={data}/></div><div className="muted">Grafik memakai pembacaan terbaru dari PostgreSQL.</div></div>
  <div className="card"><h3 className="card-title">Pembacaan sensor terakhir</h3><div className="sensor-grid">
   <div className="sensor"><label>CO₂</label><strong>{fmt(latest?.co2," ppm")}</strong></div><div className="sensor"><label>Etilen</label><strong>{fmt(latest?.ethylene," ppm")}</strong></div><div className="sensor"><label>O₂</label><strong>{fmt(latest?.oxygen," %")}</strong></div><div className="sensor"><label>Tekanan</label><strong>{fmt(latest?.pressurePa," Pa")}</strong></div><div className="sensor"><label>Daya</label><strong>{fmt(latest?.powerKw," kW")}</strong></div><div className="sensor"><label>Pintu</label><strong>{latest?.doorOpen==null?"—":latest.doorOpen?"Terbuka":"Tertutup"}</strong></div>
  </div></div>
 </div>
 <div className="notice">Dashboard ini membaca data aktual dari database. Jalankan seed script untuk mengisi data simulasi awal, atau kirim pembacaan sensor melalui POST /api/sensors.</div>
 </Frame>
}
