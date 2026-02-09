"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface TextItem {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  opacity: number;
  rotation: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  animate: boolean;
  animationType: "none" | "pulse" | "bounce" | "shake" | "glow" | "wave" | "typewriter";
  animationSpeed: number;
}

export interface TextOverlayProps {
  items: TextItem[];
  width: number;
  height: number;
}

export interface TextOverlayHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

const fontFamilies: Record<string, string> = {
  "sans-serif": "Inter, system-ui, -apple-system, sans-serif",
  "serif": "Georgia, Cambria, 'Times New Roman', serif",
  "mono": "'Fira Code', 'Courier New', monospace",
  "display": "'Bebas Neue', Impact, sans-serif",
  "handwriting": "'Caveat', cursive, sans-serif",
  "condensed": "'Oswald', 'Arial Narrow', sans-serif",
};

export const TextOverlay = forwardRef<TextOverlayHandle, TextOverlayProps>(
  ({ items, width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(Date.now());

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const render = () => {
        const time = (Date.now() - startTimeRef.current) / 1000;

        // Clear canvas (transparent background for overlay)
        ctx.clearRect(0, 0, width, height);

        // Render each text item
        items.forEach((item) => {
          if (!item.text) return;

          ctx.save();

          // Calculate position from percentage
          const x = (item.x / 100) * width;
          const y = (item.y / 100) * height;

          // Apply animation transforms
          let animX = x;
          let animY = y;
          let animScale = 1;
          let animOpacity = item.opacity;
          let animRotation = item.rotation;
          let displayText = item.text;

          if (item.animate) {
            const speed = item.animationSpeed;
            const t = time * speed;

            switch (item.animationType) {
              case "pulse":
                animScale = 1 + Math.sin(t * 3) * 0.1;
                break;
              case "bounce":
                animY = y + Math.abs(Math.sin(t * 4)) * -20;
                break;
              case "shake":
                animX = x + Math.sin(t * 20) * 3;
                animY = y + Math.cos(t * 20) * 2;
                break;
              case "glow":
                // Glow handled in shadow
                break;
              case "wave":
                animRotation = item.rotation + Math.sin(t * 2) * 5;
                break;
              case "typewriter":
                const charCount = Math.floor((t * 5) % (item.text.length + 10));
                displayText = item.text.substring(0, Math.min(charCount, item.text.length));
                break;
            }
          }

          // Translate to position
          ctx.translate(animX, animY);
          ctx.rotate((animRotation * Math.PI) / 180);
          ctx.scale(animScale, animScale);

          // Set font
          const fontFamily = fontFamilies[item.fontFamily] || item.fontFamily;
          ctx.font = `${item.fontWeight} ${item.fontSize}px ${fontFamily}`;
          ctx.textAlign = item.textAlign;
          ctx.textBaseline = "middle";

          // Set letter spacing (approximation via character-by-character rendering if needed)
          // Canvas doesn't support letterSpacing directly in all browsers

          // Apply shadow
          if (item.shadow || (item.animate && item.animationType === "glow")) {
            ctx.shadowColor = item.shadowColor;
            ctx.shadowBlur = item.animationType === "glow"
              ? item.shadowBlur + Math.sin(time * item.animationSpeed * 3) * 10
              : item.shadowBlur;
            ctx.shadowOffsetX = item.shadowOffsetX;
            ctx.shadowOffsetY = item.shadowOffsetY;
          }

          // Draw stroke first (if enabled)
          if (item.stroke && item.strokeWidth > 0) {
            ctx.strokeStyle = item.strokeColor;
            ctx.lineWidth = item.strokeWidth;
            ctx.lineJoin = "round";
            ctx.globalAlpha = animOpacity;

            // Handle multi-line text
            const lines = displayText.split("\n");
            lines.forEach((line, index) => {
              const lineY = index * item.fontSize * item.lineHeight -
                ((lines.length - 1) * item.fontSize * item.lineHeight) / 2;
              ctx.strokeText(line, 0, lineY);
            });
          }

          // Draw fill
          ctx.fillStyle = item.color;
          ctx.globalAlpha = animOpacity;

          // Handle multi-line text
          const lines = displayText.split("\n");
          lines.forEach((line, index) => {
            const lineY = index * item.fontSize * item.lineHeight -
              ((lines.length - 1) * item.fontSize * item.lineHeight) / 2;
            ctx.fillText(line, 0, lineY);
          });

          ctx.restore();
        });

        animationRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        cancelAnimationFrame(animationRef.current);
      };
    }, [items, width, height]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />
    );
  }
);

TextOverlay.displayName = "TextOverlay";

// Default text item factory
export const createDefaultTextItem = (id: string): TextItem => ({
  id,
  text: "Your Text",
  x: 50,
  y: 50,
  fontSize: 48,
  fontFamily: "sans-serif",
  fontWeight: 700,
  color: "#ffffff",
  opacity: 1,
  rotation: 0,
  letterSpacing: 0,
  lineHeight: 1.2,
  textAlign: "center",
  shadow: true,
  shadowColor: "rgba(0, 0, 0, 0.5)",
  shadowBlur: 10,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  stroke: false,
  strokeColor: "#000000",
  strokeWidth: 2,
  animate: false,
  animationType: "none",
  animationSpeed: 1,
});

export default TextOverlay;
