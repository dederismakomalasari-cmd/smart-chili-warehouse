import { PrismaClient, StorageRoom } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){
 await prisma.sensorReading.deleteMany();await prisma.alert.deleteMany();await prisma.lot.deleteMany();
 const now=Date.now();
 for(let i=11;i>=0;i--){const t=new Date(now-i*60*60*1000);for(const room of [StorageRoom.COLD_A,StorageRoom.COLD_B]){
  const b=room===StorageRoom.COLD_A?0:1;
  await prisma.sensorReading.create({data:{deviceId:`ESP32-${room}`,room,temperature:Number((7.8+b*1.2+Math.sin(i)*.3).toFixed(1)),humidity:86-b*4,co2:room===StorageRoom.COLD_B&&i===0?1680:820+b*240,ethylene:.4+b*.3,oxygen:20.8-b*.4,pressurePa:8-b*2,doorOpen:false,powerKw:2.1-b*.6,energyKwh:1.7,recordedAt:t}});
 }}
 await prisma.lot.createMany({data:[
 {lotCode:"SCW-1611-008",qrCode:"QR-SCW-1611-008",weightKg:240,crateCount:12,aiClass:"CABAI_SEGAR",grade:"Pending QC mapping",storageRoom:"COLD_A",rackCode:"A-02",status:"STORED"},
 {lotCode:"SCW-1611-007",qrCode:"QR-SCW-1611-007",weightKg:38,crateCount:2,aiClass:"CABAI_BUSUK_5",storageRoom:"COLD_B",rackCode:"B-01",status:"STORED"},
 {lotCode:"SCW-1611-006",qrCode:"QR-SCW-1611-006",weightKg:12,crateCount:1,aiClass:"CABAI_BUSUK_10",storageRoom:"REJECT",status:"REJECTED"}
 ]});
 await prisma.alert.create({data:{code:"CO2_HIGH",title:"CO₂ melewati ambang peringatan",message:"CO₂ 1.680 ppm pada Cold Storage B. Exhaust fan disimulasikan aktif.",severity:"WARNING",room:"COLD_B",source:"SEED"}});
}
main().finally(()=>prisma.$disconnect());
