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
  const [ffmpegError, setFfmpegError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ffmpegRef = useRef<any>(null);
  const loadAttemptedRef = useRef(false);

  // Load FFmpeg when MP4 is selected
  const loadFFmpeg = useCallback(async () => {
    // Prevent multiple load attempts
    if (ffmpegLoaded || ffmpegLoading || loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;

    setFfmpegLoading(true);
    setFfmpegError(null);
    setStatusText("Loading MP4 encoder...");

    try {
      console.log("[FFmpeg] Starting load...");

      // Dynamic import for FFmpeg 0.11.x
      const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
      console.log("[FFmpeg] Module imported");

      const ffmpeg = createFFmpeg({
        log: true, // Enable logging for debugging
        progress: ({ ratio }: { ratio: number }) => {
          console.log("[FFmpeg] Progress:", ratio);
          setProgress(Math.round(50 + ratio * 50));
        },
        // Use single-threaded core that doesn't require SharedArrayBuffer
        corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
      });

      console.log("[FFmpeg] Loading WASM...");
      await ffmpeg.load();
      console.log("[FFmpeg] WASM loaded successfully!");

      ffmpegRef.current = { ffmpeg, fetchFile };
      setFfmpegLoaded(true);
      setStatusText("");
    } catch (error) {
      console.error("[FFmpeg] Failed to load:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setFfmpegError(errorMsg);
      setStatusText(`Failed: ${errorMsg}`);
      // Don't auto-switch to webm - let user decide
    } finally {
      setFfmpegLoading(false);
    }
  }, [ffmpegLoaded, ffmpegLoading]);

  // Load FFmpeg when dialog opens with MP4 selected
  useEffect(() => {
    if (isOpen && format === "mp4" && !ffmpegLoaded && !ffmpegLoading && !loadAttemptedRef.current) {
      loadFFmpeg();
    }
  }, [isOpen, format, ffmpegLoaded, ffmpegLoading, loadFFmpeg]);

  const convertToMp4 = useCallback(async (webmBlob: Blob, targetResolution: Resolution): Promise<Blob> => {
    if (!ffmpegRef.current) {
      throw new Error("FFmpeg not loaded");
    }

    const { ffmpeg, fetchFile } = ffmpegRef.current;
    setStatusText("Converting to MP4 (high quality)...");

    console.log("[FFmpeg] Writing input file...");
    // Write webm to FFmpeg virtual filesystem
    ffmpeg.FS("writeFile", "input.webm", await fetchFile(webmBlob));

    // Re-encode to H.264 MP4 for maximum compatibility
    const crf = targetResolution === "4k" ? "20" : "18";

    console.log("[FFmpeg] Running conversion...");
    await ffmpeg.run(
      "-i", "input.webm",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", crf,
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "output.mp4"
    );

    console.log("[FFmpeg] Reading output file...");
    // Read the output
    const mp4Data = ffmpeg.FS("readFile", "output.mp4");
    const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });

    // Cleanup
    ffmpeg.FS("unlink", "input.webm");
    ffmpeg.FS("unlink", "output.mp4");

    console.log("[FFmpeg] Conversion complete!");
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
      if (ffmpegError) {
        alert(`MP4 encoder failed to load: ${ffmpegError}\n\nPlease try WebM format instead.`);
        return;
      }
      if (ffmpegLoading) {
        alert("MP4 encoder is still loading. Please wait.");
        return;
      }
      // Try loading one more time
      loadAttemptedRef.current = false;
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
  }, [canvasRef, format, duration, fps, resolution, ffmpegLoaded, ffmpegLoading, ffmpegError, loadFFmpeg, convertToMp4]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsConverting(false);
    setProgress(0);
    setStatusText("");
  }, []);

  // Reset load attempt when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      loadAttemptedRef.current = false;
      setFfmpegError(null);
      setStatusText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            {format === "mp4" && (
              <p className="text-xs text-amber-400">
                {ffmpegLoading && "Loading MP4 encoder..."}
                {ffmpegLoaded && <span className="text-green-400">MP4 encoder ready</span>}
                {ffmpegError && <span className="text-red-400">Error: {ffmpegError}</span>}
                {!ffmpegLoading && !ffmpegLoaded && !ffmpegError && "MP4 encoder will load automatically"}
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
          {(isRecording || isConverting || (ffmpegLoading && format === "mp4")) && (
            <div className="space-y-2">
              <Label className="text-sm text-neutral-300">
                {statusText || "Processing..."} {!ffmpegLoading && `${progress}%`}
              </Label>
              {!ffmpegLoading && (
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isRecording && !isConverting ? (
              <Button
                onClick={recordVideo}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={(format === "mp4" && ffmpegLoading) || (format === "mp4" && !!ffmpegError)}
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
