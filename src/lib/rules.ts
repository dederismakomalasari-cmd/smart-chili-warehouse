import { AlertSeverity, StorageRoom } from "@prisma/client";

export type SensorInput = {
  room: StorageRoom; temperature?: number; humidity?: number; co2?: number;
  ethylene?: number; oxygen?: number; pressurePa?: number; doorOpen?: boolean;
};

export function evaluateRules(s: SensorInput) {
  const actions: { actuator: string; state: string; reason: string }[] = [];
  const alerts: { code: string; title: string; message: string; severity: AlertSeverity }[] = [];
  if (s.temperature != null) {
    if (s.temperature > 10) actions.push({actuator:"CHILLER",state:"ON",reason:`Suhu ${s.temperature}°C di atas 10°C`});
    else if (s.temperature < 7) actions.push({actuator:"CHILLER",state:"OFF",reason:`Suhu ${s.temperature}°C di bawah 7°C`});
  }
  if (s.humidity != null && s.humidity < 80) actions.push({actuator:"HUMIDIFIER",state:"ON",reason:`RH ${s.humidity}% di bawah 80%`});
  if (s.co2 != null && s.co2 > 3000) {
    actions.push({actuator:"EXHAUST_FAN",state:"FULL",reason:`CO₂ ${s.co2} ppm melewati 3.000 ppm`});
    actions.push({actuator:"BUZZER",state:"ON",reason:"Ambang CO₂ kritis"});
    alerts.push({code:"CO2_CRITICAL",title:"CO₂ kritis",message:`CO₂ ${s.co2} ppm. Ventilasi penuh dan buzzer diperlukan.`,severity:"CRITICAL"});
  } else if (s.co2 != null && s.co2 > 1500) {
    actions.push({actuator:"EXHAUST_FAN",state:"ON",reason:`CO₂ ${s.co2} ppm melewati 1.500 ppm`});
    alerts.push({code:"CO2_HIGH",title:"CO₂ melewati ambang peringatan",message:`CO₂ ${s.co2} ppm. Exhaust fan diaktifkan.`,severity:"WARNING"});
  }
  if (s.ethylene != null && s.ethylene > 1) alerts.push({code:"ETHYLENE_HIGH",title:"Etilen meningkat",message:`Etilen ${s.ethylene} ppm melewati 1,0 ppm.`,severity:"WARNING"});
  if (s.oxygen != null && s.oxygen < 19.5) alerts.push({code:"O2_LOW",title:"Oksigen rendah",message:`O₂ ${s.oxygen}% di bawah 19,5%.`,severity:"CRITICAL"});
  if (s.pressurePa != null && (s.pressurePa < 5 || s.pressurePa > 15)) alerts.push({code:"PRESSURE_OUT_OF_RANGE",title:"Tekanan diferensial di luar rentang",message:`Tekanan ${s.pressurePa} Pa; target +5 sampai +15 Pa.`,severity:"WARNING"});
  if (s.doorOpen) alerts.push({code:"DOOR_OPEN",title:"Pintu ruang terbuka",message:"Pintu terdeteksi terbuka. Peringatan durasi >3 menit perlu timer/event lanjutan.",severity:"INFO"});
  return { actions, alerts };
}
