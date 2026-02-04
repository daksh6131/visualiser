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
type Resolution = "720p" | "1080p" | "4k";

const resolutionMap: Record<Resolution, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

export const DownloadButton: React.FC<DownloadButtonProps> = ({ canvasRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<VideoFormat>("webm");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(30);
  const [isOpen, setIsOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const recordVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }

    setIsRecording(true);
    setProgress(0);
    chunksRef.current = [];

    try {
      // Get canvas stream
      const stream = canvas.captureStream(fps);

      // Determine mime type
      const mimeType = format === "webm"
        ? "video/webm;codecs=vp9"
        : "video/webm"; // GIF will be converted from webm

      // Check if mime type is supported
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        const fallbackMime = "video/webm";
        if (!MediaRecorder.isTypeSupported(fallbackMime)) {
          throw new Error("Video recording not supported in this browser");
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
        videoBitsPerSecond: 8000000, // 8 Mbps for quality
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement("a");
        a.href = url;
        a.download = `animation-${Date.now()}.${format === "gif" ? "webm" : format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsRecording(false);
        setProgress(100);
        setIsOpen(false);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Progress updates
      const totalMs = duration * 1000;
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / totalMs) * 100, 99);
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
    }
  }, [canvasRef, format, duration, fps]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setProgress(0);
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
            <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)} disabled={isRecording}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="webm" className="text-neutral-200">WebM (Best Quality)</SelectItem>
                <SelectItem value="gif" className="text-neutral-200">WebM (GIF-like, smaller)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolution Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)} disabled={isRecording}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="720p" className="text-neutral-200">720p (1280×720)</SelectItem>
                <SelectItem value="1080p" className="text-neutral-200">1080p (1920×1080)</SelectItem>
                <SelectItem value="4k" className="text-neutral-200">4K (3840×2160)</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={isRecording}
              className="bg-neutral-800 border-neutral-700 text-neutral-200"
            />
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-300">Frame Rate (FPS)</Label>
            <Select value={fps.toString()} onValueChange={(v) => setFps(parseInt(v))} disabled={isRecording}>
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
          {isRecording && (
            <div className="space-y-2">
              <Label className="text-sm text-neutral-300">Recording... {progress}%</Label>
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
            {!isRecording ? (
              <Button
                onClick={recordVideo}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={cancelRecording}
                variant="destructive"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-neutral-500 text-center">
            The animation will be recorded in real-time. Keep this tab active during recording.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadButton;
