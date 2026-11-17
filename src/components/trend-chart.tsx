"use client";
import { ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,Legend } from "recharts";
export function TrendChart({data}:{data:{time:string;temperature:number;humidity:number}[]}){
 if(!data.length)return <div className="muted" style={{padding:20}}>Belum ada data sensor. Jalankan seed atau kirim telemetry.</div>;
 return <ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#edf1ec"/><XAxis dataKey="time" tick={{fontSize:10}}/><YAxis yAxisId="left" tick={{fontSize:10}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:10}}/><Tooltip/><Legend/><Line yAxisId="left" type="monotone" dataKey="temperature" name="Suhu °C" stroke="#2f7952" strokeWidth={2} dot={false}/><Line yAxisId="right" type="monotone" dataKey="humidity" name="RH %" stroke="#d7a34b" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
}
