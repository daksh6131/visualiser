"use client";

import React, { useState, useRef, useCallback } from "react";
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

type VideoFormat = "webm" | "gif";
type Quality = "standard" | "high" | "maximum";

const qualitySettings: Record<Quality, { bitrate: number; label: string }> = {
  standard: { bitrate: 8000000, label: "Standard (8 Mbps)" },
  high: { bitrate: 16000000, label: "High (16 Mbps)" },
  maximum: { bitrate: 32000000, label: "Maximum (32 Mbps)" },
};

export const DownloadButton: React.FC<DownloadButtonProps> = ({ canvasRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [format, setFormat] = useState<VideoFormat>("webm");
  const [quality, setQuality] = useState<Quality>("high");
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(30);
  const [isOpen, setIsOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const framesRef = useRef<string[]>([]);

  // Record video using native MediaRecorder (WebM)
  const recordWebM = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }

    setIsRecording(true);
    setProgress(0);
    setStatusText("Recording...");
    chunksRef.current = [];

    try {
      const stream = canvas.captureStream(fps);

      // Try VP9 first, fallback to VP8
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
        }
      }

      const bitrate = qualitySettings[quality].bitrate;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        downloadBlob(blob, `animation-${Date.now()}.webm`);

        setIsRecording(false);
        setProgress(100);
        setStatusText("Done!");
        setTimeout(() => {
          setIsOpen(false);
          setStatusText("");
          setProgress(0);
        }, 1000);
      };

      mediaRecorder.start(100);

      // Progress updates
      const totalMs = duration * 1000;
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / totalMs) * 99, 99);
        setProgress(Math.round(pct));
      }, 100);

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
      setStatusText("");
    }
  }, [canvasRef, duration, fps, quality]);

  // Record GIF by capturing frames
  const recordGIF = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }

    setIsRecording(true);
    setProgress(0);
    setStatusText("Capturing frames...");
    framesRef.current = [];

    const totalFrames = Math.ceil(duration * fps);
    const frameInterval = 1000 / fps;
    let frameCount = 0;

    const captureFrame = () => {
      if (frameCount >= totalFrames) {
        // Start processing
        processGIF();
        return;
      }

      try {
        const dataUrl = canvas.toDataURL("image/png", 0.92);
        framesRef.current.push(dataUrl);
        frameCount++;
        setProgress(Math.round((frameCount / totalFrames) * 50));

        setTimeout(captureFrame, frameInterval);
      } catch (error) {
        console.error("Frame capture error:", error);
        setIsRecording(false);
        setStatusText("");
      }
    };

    const processGIF = async () => {
      setIsProcessing(true);
      setStatusText("Creating GIF...");

      try {
        // Dynamic import of gif.js
        const GIF = (await import("gif.js")).default;

        const gif = new GIF({
          workers: 4,
          quality: quality === "maximum" ? 1 : quality === "high" ? 5 : 10,
          width: canvas.width,
          height: canvas.height,
          workerScript: "/gif.worker.js",
        });

        // Add frames
        for (let i = 0; i < framesRef.current.length; i++) {
          const img = new Image();
          img.src = framesRef.current[i];
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          gif.addFrame(img, { delay: frameInterval });
          setProgress(50 + Math.round((i / framesRef.current.length) * 45));
        }

        gif.on("finished", (blob: Blob) => {
          downloadBlob(blob, `animation-${Date.now()}.gif`);
          setIsRecording(false);
          setIsProcessing(false);
          setProgress(100);
          setStatusText("Done!");
          setTimeout(() => {
            setIsOpen(false);
            setStatusText("");
            setProgress(0);
          }, 1000);
        });

        gif.render();
      } catch (error) {
        console.error("GIF processing error:", error);
        // Fallback: download as PNG sequence zip or just the first frame
        alert("GIF creation failed. Try WebM format instead.");
        setIsRecording(false);
        setIsProcessing(false);
        setStatusText("");
      }
    };

    captureFrame();
  }, [canvasRef, duration, fps, quality]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startRecording = useCallback(() => {
    if (format === "webm") {
      recordWebM();
    } else {
      recordGIF();
    }
  }, [format, recordWebM, recordGIF]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
    setProgress(0);
    setStatusText("");
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStatusText("");
    }
  };

  // Download current frame as PNG
  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `animation-frame-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [canvasRef]);

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
            Record and download the animation as a video or image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick PNG Download */}
          <Button
            onClick={downloadPNG}
            variant="outline"
            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
            disabled={isRecording || isProcessing}
          >
            Download Current Frame (PNG)
          </Button>

          <div className="border-t border-neutral-700 pt-4">
            <Label className="text-sm text-neutral-300 font-medium">Video Export</Label>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)} disabled={isRecording || isProcessing}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="webm" className="text-neutral-200">WebM (Fast, High Quality)</SelectItem>
                <SelectItem value="gif" className="text-neutral-200">GIF (Universal, Larger File)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              {format === "webm"
                ? "WebM plays on all modern browsers, devices & social media. Best quality-to-size ratio."
                : "GIF works everywhere but has larger file size and limited colors."}
            </p>
          </div>

          {/* Quality Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Quality</Label>
            <Select value={quality} onValueChange={(v) => setQuality(v as Quality)} disabled={isRecording || isProcessing}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="standard" className="text-neutral-200">Standard (Smaller file)</SelectItem>
                <SelectItem value="high" className="text-neutral-200">High (Recommended)</SelectItem>
                <SelectItem value="maximum" className="text-neutral-200">Maximum (Best quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Duration (seconds)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))}
              min={1}
              max={30}
              disabled={isRecording || isProcessing}
              className="bg-neutral-800 border-neutral-700 text-neutral-200"
            />
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Frame Rate</Label>
            <Select value={fps.toString()} onValueChange={(v) => setFps(parseInt(v))} disabled={isRecording || isProcessing}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="24" className="text-neutral-200">24 FPS (Cinematic)</SelectItem>
                <SelectItem value="30" className="text-neutral-200">30 FPS (Standard)</SelectItem>
                <SelectItem value="60" className="text-neutral-200">60 FPS (Smooth)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress Bar */}
          {(isRecording || isProcessing) && (
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
            {!isRecording && !isProcessing ? (
              <Button
                onClick={startRecording}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={cancelRecording}
                variant="destructive"
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Cancel"}
              </Button>
            )}
          </div>

          <p className="text-xs text-neutral-500 text-center">
            Recording happens in real-time. Keep this tab active and visible.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadButton;
