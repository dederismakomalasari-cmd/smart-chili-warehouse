import {Frame} from "@/components/frame";
import {prisma} from "@/lib/prisma";
export const dynamic="force-dynamic";
export default async function Sensors(){
 const rooms=["COLD_A","COLD_B"] as const;
 const readings=await Promise.all(rooms.map(room=>prisma.sensorReading.findFirst({where:{room},orderBy:{recordedAt:"desc"}})));
 return <Frame title="Monitoring Sensor"><div className="pagehead"><div><div className="eyebrow">IoT perception layer</div><h1>Monitoring Sensor Gudang</h1><div className="sub">Pembacaan sensor terakhir dari Cold Storage A dan B.</div></div></div>
 <div className="grid two">{rooms.map((room,i)=>{const r=readings[i];return <div className="card" key={room}><h3 className="card-title">{room==="COLD_A"?"Cold Storage A · Grade A":"Cold Storage B · Grade B"}</h3><div className="sensor-grid">
 {([["Suhu",r?.temperature,"°C"],["Kelembapan",r?.humidity,"%"],["CO₂",r?.co2,"ppm"],["Etilen",r?.ethylene,"ppm"],["O₂",r?.oxygen,"%"],["Tekanan",r?.pressurePa,"Pa"]] as const).map(([label,value,unit])=><div className="sensor" key={label}><label>{label}</label><strong>{value==null?"—":`${value} ${unit}`}</strong></div>)}
 </div><p className="muted">Terakhir diperbarui: {r?.recordedAt.toLocaleString("id-ID")??"Belum ada data"}</p></div>})}</div>
 <div className="notice">Rule-based control berjalan saat telemetry masuk melalui API. Output aktuator saat ini dicatat sebagai log simulasi dan belum mengirim perintah fisik ke relay.</div></Frame>
}
