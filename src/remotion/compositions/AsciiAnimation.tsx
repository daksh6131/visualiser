import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";

interface AsciiAnimationProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  shape: "cup" | "heart" | "star" | "custom";
  imageSrc?: string;
}

// ASCII density characters from darkest to lightest
const ASCII_CHARS = " .,:;i1tfLCG08@";
const ASCII_CHARS_REVERSED = "@80GCLft1i;:,. ";

// Predefined shape masks - larger and more detailed
const SHAPES: Record<string, string[]> = {
  cup: [
    "                                                  ",
    "                                                  ",
    "        ██████████████████████████████            ",
    "        ██████████████████████████████            ",
    "       ████████████████████████████████           ",
    "       ████████████████████████████  ████         ",
    "       ████████████████████████████   ████        ",
    "       ████████████████████████████    ████       ",
    "       ████████████████████████████   ████        ",
    "       ████████████████████████████  ████         ",
    "       ████████████████████████████████           ",
    "        ██████████████████████████████            ",
    "         ████████████████████████████             ",
    "          ██████████████████████████              ",
    "           ████████████████████████               ",
    "            ██████████████████████                ",
    "             ████████████████████                 ",
    "              ██████████████████                  ",
    "                ██████████████                    ",
    "                                                  ",
  ],
  heart: [
    "                                                  ",
    "                                                  ",
    "          ████████        ████████                ",
    "        ████████████    ████████████              ",
    "       ██████████████  ██████████████             ",
    "      ████████████████████████████████            ",
    "      ████████████████████████████████            ",
    "      ████████████████████████████████            ",
    "       ██████████████████████████████             ",
    "        ████████████████████████████              ",
    "          ████████████████████████                ",
    "            ████████████████████                  ",
    "              ████████████████                    ",
    "                ████████████                      ",
    "                  ████████                        ",
    "                    ████                          ",
    "                     ██                           ",
    "                                                  ",
    "                                                  ",
    "                                                  ",
  ],
  star: [
    "                                                  ",
    "                       ██                         ",
    "                      ████                        ",
    "                     ██████                       ",
    "                    ████████                      ",
    "                   ██████████                     ",
    "    ██████████████████████████████████████        ",
    "      ████████████████████████████████            ",
    "        ████████████████████████████              ",
    "          ████████████████████████                ",
    "            ██████████████████                    ",
    "           ████████████████████                   ",
    "          ██████████  ██████████                  ",
    "         ████████        ████████                 ",
    "        ████████          ████████                ",
    "       ████████            ████████               ",
    "      ████████              ████████              ",
    "                                                  ",
    "                                                  ",
    "                                                  ",
  ],
};

const generateRandomChar = (seed: number, chars: string): string => {
  const index = Math.floor(Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % chars.length);
  return chars[index];
};

export const AsciiAnimation: React.FC<AsciiAnimationProps> = ({
  text,
  backgroundColor,
  textColor,
  shape,
  imageSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const cols = 80;
  const rows = 40;
  const charWidth = width / cols;
  const charHeight = height / rows;
  const fontSize = Math.min(charWidth, charHeight) * 1.2;

  // Animation phases
  const revealProgress = interpolate(frame, [0, fps * 3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const textScrollOffset = interpolate(frame, [0, durationInFrames], [0, text.length * 2]);

  const waveAmplitude = interpolate(
    frame,
    [fps * 2, fps * 4],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Get shape mask
  const shapeMask = useMemo(() => {
    const mask = SHAPES[shape] || SHAPES.cup;
    return mask;
  }, [shape]);

  // Generate the ASCII grid
  const generateAsciiGrid = useMemo(() => {
    const grid: { char: string; inShape: boolean; delay: number }[][] = [];

    for (let row = 0; row < rows; row++) {
      const gridRow: { char: string; inShape: boolean; delay: number }[] = [];

      for (let col = 0; col < cols; col++) {
        // Check if this cell is inside the shape
        const maskRow = Math.floor((row / rows) * shapeMask.length);
        const maskCol = Math.floor((col / cols) * (shapeMask[0]?.length || 30));
        const inShape: boolean =
          !!(shapeMask[maskRow] && shapeMask[maskRow][maskCol] === "█");

        // Calculate distance from center for reveal animation
        const centerX = cols / 2;
        const centerY = rows / 2;
        const distance = Math.sqrt(
          Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2)
        );
        const maxDistance = Math.sqrt(
          Math.pow(centerX, 2) + Math.pow(centerY, 2)
        );
        const delay = distance / maxDistance;

        // Generate character
        let char: string;
        if (inShape) {
          // Inside shape: use text characters
          const textIndex = Math.floor((col + row + textScrollOffset) % text.length);
          char = text[textIndex] || " ";
        } else {
          // Outside shape: use ASCII density or random chars
          const seed = row * cols + col + frame * 0.1;
          char = generateRandomChar(seed, "01");
        }

        gridRow.push({ char, inShape, delay });
      }
      grid.push(gridRow);
    }
    return grid;
  }, [rows, cols, shapeMask, text, textScrollOffset, frame]);

  // Dotted outline around shape - create ordered contour points
  const outlinePoints = useMemo(() => {
    const edgePoints: { x: number; y: number; row: number; col: number }[] = [];
    const maskHeight = shapeMask.length;
    const maskWidth = shapeMask[0]?.length || 50;

    // First pass: find all edge cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const maskRow = Math.floor((row / rows) * maskHeight);
        const maskCol = Math.floor((col / cols) * maskWidth);
        const current = shapeMask[maskRow]?.[maskCol] === "█";

        if (!current) continue;

        // Check neighbors to see if this is an edge
        const checkMaskRow = (r: number) => Math.floor((r / rows) * maskHeight);
        const checkMaskCol = (c: number) => Math.floor((c / cols) * maskWidth);

        const neighbors = [
          shapeMask[checkMaskRow(row - 1)]?.[checkMaskCol(col)] === "█",
          shapeMask[checkMaskRow(row + 1)]?.[checkMaskCol(col)] === "█",
          shapeMask[checkMaskRow(row)]?.[checkMaskCol(col - 1)] === "█",
          shapeMask[checkMaskRow(row)]?.[checkMaskCol(col + 1)] === "█",
        ];

        const isEdge = neighbors.some((n) => !n);

        if (isEdge) {
          edgePoints.push({
            x: (col / cols) * width + charWidth / 2,
            y: (row / rows) * height + charHeight / 2,
            row,
            col,
          });
        }
      }
    }

    // Sort points to create a continuous outline (clockwise from top)
    if (edgePoints.length === 0) return [];

    // Find centroid
    const centroidX = edgePoints.reduce((sum, p) => sum + p.x, 0) / edgePoints.length;
    const centroidY = edgePoints.reduce((sum, p) => sum + p.y, 0) / edgePoints.length;

    // Sort by angle from centroid
    const sortedPoints = edgePoints.sort((a, b) => {
      const angleA = Math.atan2(a.y - centroidY, a.x - centroidX);
      const angleB = Math.atan2(b.y - centroidY, b.x - centroidX);
      return angleA - angleB;
    });

    // Sample every nth point for cleaner dots
    const sampledPoints = sortedPoints.filter((_, i) => i % 3 === 0);

    return sampledPoints.map((p) => ({ x: p.x, y: p.y }));
  }, [shapeMask, rows, cols, width, height, charWidth, charHeight]);

  const outlineProgress = interpolate(frame, [fps, fps * 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* Gradient overlay at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
          zIndex: 1,
        }}
      />

      {/* ASCII Grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "monospace",
          fontSize: `${fontSize}px`,
          lineHeight: `${charHeight}px`,
        }}
      >
        {generateAsciiGrid.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "flex",
              whiteSpace: "pre",
            }}
          >
            {row.map((cell, colIndex) => {
              const cellReveal = interpolate(
                revealProgress,
                [cell.delay * 0.8, cell.delay * 0.8 + 0.2],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              // Wave distortion
              const waveOffset =
                Math.sin((colIndex + frame * 0.1) * 0.1) * waveAmplitude * 2;

              const opacity = cell.inShape
                ? interpolate(cellReveal, [0, 1], [0.1, 1])
                : interpolate(cellReveal, [0, 1], [0.05, 0.3]);

              return (
                <span
                  key={colIndex}
                  style={{
                    width: `${charWidth}px`,
                    textAlign: "center",
                    color: cell.inShape ? textColor : textColor,
                    opacity,
                    transform: `translateY(${waveOffset}px)`,
                    fontWeight: cell.inShape ? "bold" : "normal",
                  }}
                >
                  {cell.char}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Dotted outline SVG overlay */}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        {outlinePoints.slice(0, Math.floor(outlinePoints.length * outlineProgress)).map((point, index) => {
          const pulseScale = 1 + Math.sin((frame + index * 2) * 0.2) * 0.3;
          const glowOpacity = interpolate(
            Math.sin((frame + index) * 0.15),
            [-1, 1],
            [0.3, 0.8]
          );

          return (
            <g key={index}>
              {/* Glow */}
              <circle
                cx={point.x}
                cy={point.y}
                r={8 * pulseScale}
                fill="#84cc16"
                opacity={glowOpacity * 0.3}
              />
              {/* Main dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={4 * pulseScale}
                fill="#84cc16"
                opacity={glowOpacity}
              />
            </g>
          );
        })}

        {/* Dashed line connecting outline points */}
        {outlinePoints.length > 1 && (
          <path
            d={`M ${outlinePoints.map((p) => `${p.x},${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#84cc16"
            strokeWidth={2}
            strokeDasharray="8,12"
            strokeDashoffset={-frame * 2}
            opacity={0.6 * outlineProgress}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
