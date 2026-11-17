import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { evaluateRules } from "@/lib/rules";
import { StorageRoom } from "@prisma/client";

const schema = z.object({
  deviceId: z.string().min(1), room: z.nativeEnum(StorageRoom),
  temperature: z.number().optional(), humidity: z.number().optional(),
  co2: z.number().optional(), ethylene: z.number().optional(), oxygen: z.number().optional(),
  pressurePa: z.number().optional(), doorOpen: z.boolean().optional(),
  powerKw: z.number().optional(), energyKwh: z.number().optional(), lux: z.number().optional(),
  airflow: z.number().optional(), vibration: z.number().optional(),
  weightKg: z.number().optional(), conveyorMs: z.number().optional(),
  recordedAt: z.string().datetime().optional()
});
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const reading = await prisma.sensorReading.create({ data: {
      ...body, recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date()
    }});
    const evaluation = evaluateRules(body);
    if (evaluation.alerts.length) await prisma.alert.createMany({data:evaluation.alerts.map(a=>({...a,room:body.room,source:"RULE_BASED"}))});
    if (evaluation.actions.length) await prisma.actuatorLog.createMany({data:evaluation.actions.map(a=>({
      deviceId:body.deviceId,room:body.room,actuator:a.actuator,state:a.state,reason:a.reason
    }))});
    return NextResponse.json({ reading, ruleEvaluation: evaluation }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid payload" }, { status: 400 });
  }
}
export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room") as StorageRoom | null;
  const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 500);
  const readings = await prisma.sensorReading.findMany({
    where: room ? { room } : {}, orderBy:{recordedAt:"desc"}, take
  });
  return NextResponse.json({ readings });
}
