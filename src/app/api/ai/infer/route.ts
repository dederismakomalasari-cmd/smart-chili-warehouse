import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const upstream = process.env.YOLO_SERVICE_URL || "http://127.0.0.1:8001";

  try {
    const response = await fetch(`${upstream}/health`, { cache: "no-store" });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json(
      { ok: false, model_loaded: false, error: "YOLO service tidak dapat dihubungi." },
      { status: 503 }
    );
  }
}

export async function POST(req:NextRequest) {
  const form = await req.formData();
  const image = form.get("image");
  if (!(image instanceof File)) return NextResponse.json({error:"Field image wajib berupa file."},{status:400});
  const upstream = process.env.YOLO_SERVICE_URL || "http://127.0.0.1:8001";
  const payload = new FormData(); payload.append("file",image,image.name);
  try {
    const response = await fetch(`${upstream}/predict`,{method:"POST",body:payload,cache:"no-store"});
    const result = await response.json();
    return NextResponse.json(result,{status:response.status});
  } catch {
    return NextResponse.json({error:"YOLO service tidak dapat dihubungi. Pastikan FastAPI berjalan."},{status:503});
  }
}
