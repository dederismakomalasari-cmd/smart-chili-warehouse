import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
const schema = z.object({
  lotCode:z.string().min(3), qrCode:z.string().min(3), weightKg:z.number().positive(),
  crateCount:z.number().int().positive().default(1), origin:z.string().optional()
});
export async function GET() {
  const lots = await prisma.lot.findMany({orderBy:{receivedAt:"desc"},take:200});
  return NextResponse.json({lots});
}
export async function POST(req:NextRequest) {
  try {
    const data=schema.parse(await req.json());
    const lot=await prisma.lot.create({data});
    return NextResponse.json({lot},{status:201});
  } catch(e) {
    return NextResponse.json({error:e instanceof Error?e.message:"Invalid payload"},{status:400});
  }
}
