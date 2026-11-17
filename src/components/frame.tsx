import { Sidebar } from "./sidebar";
export function Frame({children,title}:{children:React.ReactNode;title:string}){
 return <div className="shell"><Sidebar/><main className="main"><header className="topbar"><div className="muted">Smart Chili Warehouse / <b style={{color:"#1d2b22"}}>{title}</b></div><div style={{display:"flex",alignItems:"center",gap:12}}><span className="status">● APP ONLINE</span><b style={{fontSize:12}}>SCW Admin</b></div></header><div className="content">{children}</div></main></div>
}
