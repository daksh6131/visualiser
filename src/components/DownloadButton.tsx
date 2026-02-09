"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DownloadButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

type VideoFormat = "webm" | "mp4";
type Resolution = "720p" | "1080p" | "4k";

const resolutionMap: Record<Resolution, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

// Dynamic import for FFmpeg
let FFmpeg: any = null;
let fetchFile: any = null;

export const DownloadButton: React.FC<DownloadButtonProps> = ({ canvasRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [format, setFormat] = useState<VideoFormat>("mp4");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(30);
  const [isOpen, setIsOpen] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ffmpegRef = useRef<any>(null);

  // Load FFmpeg when MP4 is selected
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegLoaded || ffmpegLoading) return;

    setFfmpegLoading(true);
    setStatusText("Loading MP4 encoder...");

    try {
      const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
      const { fetchFile: fetchFileFunc } = await import("@ffmpeg/util");

      FFmpeg = FFmpegClass;
      fetchFile = fetchFileFunc;

      const ffmpeg = new FFmpeg();

      ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
        setProgress(Math.round(50 + p * 50)); // 50-100% for conversion
      });

      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      setStatusText("");
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      setStatusText("Failed to load MP4 encoder. Using WebM instead.");
      setFormat("webm");
    } finally {
      setFfmpegLoading(false);
    }
  }, [ffmpegLoaded, ffmpegLoading]);

  // Load FFmpeg when format changes to MP4
  useEffect(() => {
    if (format === "mp4" && !ffmpegLoaded && !ffmpegLoading) {
      loadFFmpeg();
    }
  }, [format, ffmpegLoaded, ffmpegLoading, loadFFmpeg]);

  const convertToMp4 = useCallback(async (webmBlob: Blob, targetResolution: Resolution): Promise<Blob> => {
    if (!ffmpegRef.current) {
      throw new Error("FFmpeg not loaded");
    }

    const ffmpeg = ffmpegRef.current;
    setStatusText("Converting to MP4 (high quality)...");

    // Write webm to FFmpeg virtual filesystem
    const webmData = await fetchFile(webmBlob);
    await ffmpeg.writeFile("input.webm", webmData);

    // CRF values: lower = better quality, higher = smaller file
    // 18 is visually lossless, 23 is default, we use 18 for best quality
    const crf = targetResolution === "4k" ? "16" : "18";

    // Convert to MP4 with H.264 codec - high quality settings
    await ffmpeg.exec([
      "-i", "input.webm",
      "-c:v", "libx264",
      "-preset", "slow",        // Better compression, higher quality
      "-crf", crf,              // High quality (lower = better)
      "-profile:v", "high",     // H.264 High Profile
      "-level", "4.2",          // Compatibility level
      "-pix_fmt", "yuv420p",    // Standard pixel format
      "-movflags", "+faststart", // Web optimization
      "output.mp4"
    ]);

    // Read the output
    const mp4Data = await ffmpeg.readFile("output.mp4");
    const mp4Blob = new Blob([mp4Data], { type: "video/mp4" });

    // Cleanup
    await ffmpeg.deleteFile("input.webm");
    await ffmpeg.deleteFile("output.mp4");

    return mp4Blob;
  }, []);

  const recordVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }

    // Check if MP4 is selected but FFmpeg isn't loaded
    if (format === "mp4" && !ffmpegLoaded) {
      await loadFFmpeg();
      if (!ffmpegRef.current) {
        alert("MP4 encoder failed to load. Please try WebM format.");
        return;
      }
    }

    setIsRecording(true);
    setProgress(0);
    setStatusText("Recording...");
    chunksRef.current = [];

    try {
      // Get canvas stream
      const stream = canvas.captureStream(fps);

      // Always record as WebM first (browser native)
      const mimeType = "video/webm;codecs=vp9";

      // Check if mime type is supported
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        const fallbackMime = "video/webm";
        if (!MediaRecorder.isTypeSupported(fallbackMime)) {
          throw new Error("Video recording not supported in this browser");
        }
      }

      // Higher bitrate for 4K
      const res = resolutionMap[resolution];
      const bitrate = res.width >= 3840 ? 35000000 : res.width >= 1920 ? 15000000 : 8000000;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
        videoBitsPerSecond: bitrate,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunksRef.current, { type: "video/webm" });

        let finalBlob: Blob;
        let extension: string;

        if (format === "mp4" && ffmpegRef.current) {
          setIsConverting(true);
          setProgress(50);
          setStatusText("Converting to MP4...");

          try {
            finalBlob = await convertToMp4(webmBlob, resolution);
            extension = "mp4";
          } catch (error) {
            console.error("MP4 conversion failed:", error);
            setStatusText("MP4 conversion failed, downloading as WebM");
            finalBlob = webmBlob;
            extension = "webm";
          }
        } else {
          finalBlob = webmBlob;
          extension = "webm";
        }

        // Create download link
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `animation-${resolution}-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsRecording(false);
        setIsConverting(false);
        setProgress(100);
        setStatusText("Done!");
        setTimeout(() => {
          setIsOpen(false);
          setStatusText("");
          setProgress(0);
        }, 1000);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Progress updates (0-50% for recording, 50-100% for conversion if MP4)
      const totalMs = duration * 1000;
      const startTime = Date.now();
      const maxProgress = format === "mp4" ? 50 : 99;

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / totalMs) * maxProgress, maxProgress);
        setProgress(Math.round(pct));
      }, 100);

      // Stop after duration
      setTimeout(() => {
        clearInterval(progressInterval);
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, totalMs);

    } catch (error) {
      console.error("Recording error:", error);
      alert(`Recording failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsRecording(false);
      setIsConverting(false);
      setStatusText("");
    }
  }, [canvasRef, format, duration, fps, resolution, ffmpegLoaded, loadFFmpeg, convertToMp4]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsConverting(false);
    setProgress(0);
    setStatusText("");
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-sm bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
        >
          Download
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-neutral-200">
        <DialogHeader>
          <DialogTitle>Export Animation</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Record and download the animation as a video file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)} disabled={isRecording || isConverting}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="mp4" className="text-neutral-200">MP4 (Best Compatibility)</SelectItem>
                <SelectItem value="webm" className="text-neutral-200">WebM (Faster Export)</SelectItem>
              </SelectContent>
            </Select>
            {format === "mp4" && !ffmpegLoaded && (
              <p className="text-xs text-amber-400">
                {ffmpegLoading ? "Loading MP4 encoder..." : "MP4 encoder will load when recording starts"}
              </p>
            )}
          </div>

          {/* Resolution Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)} disabled={isRecording || isConverting}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="720p" className="text-neutral-200">720p (1280×720)</SelectItem>
                <SelectItem value="1080p" className="text-neutral-200">1080p (1920×1080)</SelectItem>
                <SelectItem value="4k" className="text-neutral-200">4K (3840×2160)</SelectItem>
              </SelectContent>
            </Select>
            {resolution === "4k" && (
              <p className="text-xs text-neutral-400">4K recording may be slow on some devices</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Duration (seconds)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))}
              min={1}
              max={60}
              disabled={isRecording || isConverting}
              className="bg-neutral-800 border-neutral-700 text-neutral-200"
            />
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Frame Rate (FPS)</Label>
            <Select value={fps.toString()} onValueChange={(v) => setFps(parseInt(v))} disabled={isRecording || isConverting}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="30" className="text-neutral-200">30 FPS (Standard)</SelectItem>
                <SelectItem value="60" className="text-neutral-200">60 FPS (Smooth)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress Bar */}
          {(isRecording || isConverting) && (
            <div className="space-y-2">
              <Label className="text-sm text-neutral-300">
                {statusText || "Processing..."} {progress}%
              </Label>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isRecording && !isConverting ? (
              <Button
                onClick={recordVideo}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={format === "mp4" && ffmpegLoading}
              >
                {format === "mp4" && ffmpegLoading ? "Loading Encoder..." : "Start Recording"}
              </Button>
            ) : (
              <Button
                onClick={cancelRecording}
                variant="destructive"
                className="flex-1"
                disabled={isConverting}
              >
                {isConverting ? "Converting..." : "Cancel"}
              </Button>
            )}
          </div>

          <p className="text-xs text-neutral-500 text-center">
            {format === "mp4"
              ? "Records in high quality, then converts to MP4. Keep tab active."
              : "The animation will be recorded in real-time. Keep this tab active."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadButton;
