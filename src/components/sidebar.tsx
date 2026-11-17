"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard,Activity,ScanSearch,Boxes,Bell,MessageCircle,Leaf } from "lucide-react";
const items=[
  ["/","Dashboard",LayoutDashboard],["/sensors","Monitoring Sensor",Activity],
  ["/sorting","AI Quality Sorting",ScanSearch],["/inventory","Inventaris & QR",Boxes],
  ["/alerts","Riwayat Notifikasi",Bell],["/assistant","WhatsApp AI",MessageCircle]
] as const;
export function Sidebar(){
 const path=usePathname();
 return <aside className="sidebar"><div className="brand"><div className="logo"><Leaf size={21}/></div><div><b>Smart Chili</b><div className="muted" style={{color:"#a9c3b1"}}>WAREHOUSE SYSTEM</div></div></div>
 <div className="nav-label">MENU UTAMA</div>{items.map(([href,label,Icon])=><Link className={`navlink ${path===href?"active":""}`} href={href} key={href}><Icon size={17}/><span>{label}</span></Link>)}
 <div style={{marginTop:40,padding:"14px 12px",borderTop:"1px solid #ffffff20",fontSize:11,color:"#b7cdbd"}}>SMART CHILI WAREHOUSE<br/>Development · v0.2<br/><span className="status" style={{marginTop:8}}>DATABASE MODE</span></div>
 </aside>
}
