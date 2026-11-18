
"use client";

import { useEffect, useRef, useState } from "react";
import { Frame } from "@/components/frame";

type Detection = {
  class_id: number;
  class_name: string;
  confidence: number;
  xyxy: number[];
};

type InferResponse = {
  model: string;
  image_width: number;
  image_height: number;
  confidence_threshold: number;
  detections: Detection[];
  count: number;
  error?: string;
  detail?: string;
};

type YoloHealth = {
  model_loaded: boolean;
};

const CLASS_NAMES: Record<number, string> = {
  0: "Cabai Busuk 10-",
  1: "Cabai Busuk 5-",
  2: "Cabai Segar",
};

const CLASS_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#f59e0b",
  2: "#22c55e",
};

export default function Sorting() {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [result, setResult] = useState<InferResponse | null>(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [yoloReady, setYoloReady] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const uploadImageRef = useRef<HTMLImageElement>(null);
  const uploadOverlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let active = true;

    async function checkYoloHealth() {
      try {
        const response = await fetch("/api/ai/infer", { cache: "no-store" });
        const health = (await response.json()) as YoloHealth;
        if (active) setYoloReady(response.ok && health.model_loaded);
      } catch {
        if (active) setYoloReady(false);
      }
    }

    checkYoloHealth();
    const timer = window.setInterval(checkYoloHealth, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const counts = {
    busuk10: detections.filter((d) => d.class_id === 0).length,
    busuk5: detections.filter((d) => d.class_id === 1).length,
    segar: detections.filter((d) => d.class_id === 2).length,
  };

  function drawDetections(
    canvas: HTMLCanvasElement,
    imageWidth: number,
    imageHeight: number,
    data: InferResponse
  ) {
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = imageWidth / data.image_width;
    const scaleY = imageHeight / data.image_height;

    data.detections.forEach((detection) => {
      const [x1, y1, x2, y2] = detection.xyxy;
      if (![x1, y1, x2, y2].every(Number.isFinite)) return;

      const x = x1 * scaleX;
      const y = y1 * scaleY;
      const width = (x2 - x1) * scaleX;
      const height = (y2 - y1) * scaleY;

      const color = CLASS_COLORS[detection.class_id] || "#3b82f6";
      const label =
        `${detection.class_name} ${(detection.confidence * 100).toFixed(1)}%`;

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, canvas.width / 320);
      ctx.strokeRect(x, y, width, height);

      const fontSize = Math.max(12, canvas.width / 55);
      ctx.font = `bold ${fontSize}px Arial`;

      const textWidth = ctx.measureText(label).width;
      const labelHeight = fontSize + 10;
      const labelY = Math.max(0, y - labelHeight);

      ctx.fillStyle = color;
      ctx.fillRect(x, labelY, textWidth + 12, labelHeight);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x + 6, labelY + fontSize + 1);
    });
  }

  function drawBoxes(data: InferResponse) {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (!video || !canvas || !video.videoWidth) return;
    drawDetections(canvas, video.videoWidth, video.videoHeight, data);
  }

  function drawUploadBoxes(data: InferResponse) {
    const image = uploadImageRef.current;
    const canvas = uploadOverlayCanvasRef.current;

    if (!image || !canvas || !image.naturalWidth) return;
    drawDetections(canvas, image.naturalWidth, image.naturalHeight, data);
  }

  async function startCamera() {
    try {
      setError("");
      setDetections([]);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraReady(true);
      setRunning(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Tidak dapat mengakses webcam: ${err.message}`
          : "Tidak dapat mengakses webcam."
      );
    }
  }

  function stopCamera() {
    setRunning(false);
    setCameraReady(false);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    setDetections([]);
    setResult(null);
  }

  useEffect(() => {
    if (!running) return;

    let active = true;

    async function scanFrame() {
      const video = videoRef.current;
      const canvas = captureCanvasRef.current;

      if (
        !active ||
        !video ||
        !canvas ||
        video.readyState < 2 ||
        busyRef.current
      ) {
        return;
      }

      busyRef.current = true;

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.8);
        });

        if (!blob || !active) return;

        const form = new FormData();
        form.append("image", blob, "webcam-frame.jpg");

        const response = await fetch("/api/ai/infer", {
          method: "POST",
          body: form,
          cache: "no-store",
        });

        const data = (await response.json()) as InferResponse;

        if (!response.ok) {
          throw new Error(
            data.error || data.detail || "Gagal memproses frame kamera."
          );
        }

        if (!active) return;

        setDetections(data.detections || []);
        setResult(data);
        drawBoxes(data);
        setError("");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Inference gagal."
          );
        }
      } finally {
        busyRef.current = false;
      }
    }

    scanFrame();
    const timer = window.setInterval(scanFrame, 500);

    return () => {
      active = false;
      window.clearInterval(timer);
      busyRef.current = false;
    };
  }, [running]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function runUpload() {
    if (!file) return;

    setBusy(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("image", file);

    try {
      const response = await fetch("/api/ai/infer", {
        method: "POST",
        body: form,
      });

      const data = (await response.json()) as InferResponse;

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Inference gagal.");
      }

      setResult(data);
      setDetections(data.detections || []);
      drawUploadBoxes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Frame title="AI Quality Sorting">
      <div className="pagehead">
        <div>
          <div className="eyebrow">EDGE AI · COMPUTER VISION</div>
          <h1>AI Quality Sorting</h1>
          <div className="sub">
            Deteksi kualitas cabai menggunakan kamera dan model YOLO11.
          </div>
        </div>
        <span className={`status ${running ? "" : "warn"}`}>
          {running ? "● Kamera Aktif" : "Kamera Nonaktif"}
        </span>
        <span className={`status ${yoloReady ? "" : "warn"}`}>
          {yoloReady === null
            ? "Memeriksa YOLO..."
            : yoloReady
              ? "● YOLO Siap"
              : "YOLO Offline"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button
          className={`btn ${mode === "camera" ? "primary" : ""}`}
          onClick={() => setMode("camera")}
        >
          Live Webcam
        </button>
        <button
          className={`btn ${mode === "upload" ? "primary" : ""}`}
          onClick={() => setMode("upload")}
        >
          Upload Gambar
        </button>
      </div>

      {mode === "camera" && (
        <div className="grid two">
          <div className="card">
            <h3 className="card-title">Live Chili Scanner</h3>

            <div
              style={{
                position: "relative",
                width: "100%",
                background: "#101a14",
                borderRadius: 12,
                overflow: "hidden",
                minHeight: 240,
              }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                }}
              />

              <canvas
                ref={overlayCanvasRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />

              {!cameraReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 42 }}>📷</div>
                    <strong>Kamera belum aktif</strong>
                    <p style={{ fontSize: 12, color: "#cbd5ce" }}>
                      Tekan tombol mulai untuk mengaktifkan webcam.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={captureCanvasRef} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {!running ? (
                <button className="btn primary" onClick={startCamera}>
                  ▶ Mulai Scanner
                </button>
              ) : (
                <button className="btn" onClick={stopCamera}>
                  ■ Matikan Kamera
                </button>
              )}
            </div>

            <p className="muted" style={{ marginTop: 12 }}>
              Deteksi otomatis setiap 500 ms jika inferensi sebelumnya sudah
              selesai.
            </p>

            {error && (
              <div className="notice" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Hasil Deteksi Real-time</h3>

            <div className="sensor-grid">
              <div className="sensor">
                <label>Cabai Segar</label>
                <strong style={{ color: "#22a35a" }}>{counts.segar}</strong>
              </div>
              <div className="sensor">
                <label>Cabai Busuk 5-</label>
                <strong style={{ color: "#d99a20" }}>{counts.busuk5}</strong>
              </div>
              <div className="sensor">
                <label>Cabai Busuk 10-</label>
                <strong style={{ color: "#dc5148" }}>{counts.busuk10}</strong>
              </div>
            </div>

            <div
              style={{
                background: "#f4f7f3",
                borderRadius: 12,
                padding: 16,
                marginTop: 14,
              }}
            >
              <div className="muted">Total objek terdeteksi</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>
                {detections.length}
              </div>
              <div className="muted">
                Model: YOLO11 · Confidence threshold:{" "}
                {result
                  ? `${(result.confidence_threshold * 100).toFixed(0)}%`
                  : "25%"}
              </div>
            </div>

            <h4 style={{ marginTop: 20 }}>Daftar objek</h4>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kelas</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ color: "#778279" }}>
                        Belum ada cabai terdeteksi.
                      </td>
                    </tr>
                  ) : (
                    detections.map((detection, index) => (
                      <tr key={`${detection.class_id}-${index}`}>
                        <td>
                          <span
                            style={{
                              color:
                                CLASS_COLORS[detection.class_id] || "#333",
                              fontWeight: 700,
                            }}
                          >
                            {CLASS_NAMES[detection.class_id] ||
                              detection.class_name}
                          </span>
                        </td>
                        <td>
                          {(detection.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="grid two">
          <div className="card">
            <h3 className="card-title">Uji deteksi gambar</h3>

            <input
              className="field"
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setResult(null);
                setDetections([]);
                setError("");
              }}
            />

            {file && (
              <p className="muted">
                File: {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}

            <button
              className="btn primary"
              style={{ marginTop: 12 }}
              disabled={!file || busy}
              onClick={runUpload}
            >
              {busy ? "Memproses..." : "Jalankan YOLO11"}
            </button>

            {error && <div className="notice">{error}</div>}

            {previewUrl && (
              <div
                style={{
                  position: "relative",
                  marginTop: 16,
                  overflow: "hidden",
                  borderRadius: 12,
                  background: "#101a14",
                }}
              >
                <img
                  ref={uploadImageRef}
                  src={previewUrl}
                  alt="Gambar cabai yang dianalisis YOLO11"
                  onLoad={() => {
                    if (result) drawUploadBoxes(result);
                  }}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
                <canvas
                  ref={uploadOverlayCanvasRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                />
              </div>
            )}

            {result && (
              <div style={{ marginTop: 16 }}>
                <h4>Hasil inferensi · {result.count} objek</h4>
                {detections.length === 0 ? (
                  <p className="muted">
                    Tidak ada cabai terdeteksi pada confidence minimal{" "}
                    {(result.confidence_threshold * 100).toFixed(0)}%.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Kelas</th>
                          <th>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detections.map((detection, index) => (
                          <tr key={`${detection.class_id}-${index}`}>
                            <td>
                              <span
                                style={{
                                  color:
                                    CLASS_COLORS[detection.class_id] || "#333",
                                  fontWeight: 700,
                                }}
                              >
                                {CLASS_NAMES[detection.class_id] ||
                                  detection.class_name}
                              </span>
                            </td>
                            <td>
                              {(detection.confidence * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="muted">
                  Confidence threshold:{" "}
                  {(result.confidence_threshold * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Kelas model dari dataset</h3>
            {Object.entries(CLASS_NAMES).map(([id, name]) => (
              <div
                className="sensor"
                style={{ marginBottom: 9 }}
                key={id}
              >
                <label>Class ID {id}</label>
                <strong>{name}</strong>
              </div>
            ))}
            <div className="notice">
              Mapping kelas deteksi menjadi Grade A/B/C harus divalidasi tim
              QC. Sistem tidak otomatis menyamakan Cabai Segar dengan Grade A.
            </div>
          </div>
        </div>
      )}
    </Frame>
  );
}
