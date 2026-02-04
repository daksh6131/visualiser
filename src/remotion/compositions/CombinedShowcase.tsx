import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";
import { GeometricAnimation } from "./GeometricAnimation";
import { AsciiAnimation } from "./AsciiAnimation";

interface Scene {
  type: "geometric" | "ascii";
  duration: number;
}

interface CombinedShowcaseProps {
  scenes: Scene[];
}

const BlurTransition: React.FC<{
  children: React.ReactNode;
  startFrame: number;
  duration: number;
}> = ({ children, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const transitionDuration = fps / 2; // 0.5 second transition

  // Fade in at start
  const fadeIn = interpolate(
    frame,
    [startFrame, startFrame + transitionDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [startFrame + duration - transitionDuration, startFrame + duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Blur during transitions
  const blurIn = interpolate(
    frame,
    [startFrame, startFrame + transitionDuration],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const blurOut = interpolate(
    frame,
    [startFrame + duration - transitionDuration, startFrame + duration],
    [0, 20],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);
  const blur = frame < startFrame + transitionDuration ? blurIn : blurOut;

  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: `blur(${blur}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const CombinedShowcase: React.FC<CombinedShowcaseProps> = ({
  scenes,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate cumulative start frames for each scene
  let currentFrame = 0;
  const sceneConfigs = scenes.map((scene, index) => {
    const config = {
      ...scene,
      startFrame: currentFrame,
      index,
    };
    currentFrame += scene.duration;
    return config;
  });

  // Geometric animation variations
  const geometricConfigs = [
    {
      backgroundColor: "#0a1628",
      primaryColor: "#fbbf24",
      accentColor: "#ec4899",
      shape: "hexagon" as const,
    },
    {
      backgroundColor: "#1a0a28",
      primaryColor: "#22d3ee",
      accentColor: "#a855f7",
      shape: "pentagon" as const,
    },
    {
      backgroundColor: "#0a280a",
      primaryColor: "#4ade80",
      accentColor: "#f97316",
      shape: "octagon" as const,
    },
  ];

  // ASCII animation variations
  const asciiConfigs = [
    {
      text: "COFFEE",
      backgroundColor: "#0066ff",
      textColor: "#ffffff",
      shape: "cup" as const,
    },
    {
      text: "LOVE",
      backgroundColor: "#ff0066",
      textColor: "#ffffff",
      shape: "heart" as const,
    },
    {
      text: "STAR",
      backgroundColor: "#6600ff",
      textColor: "#ffffff",
      shape: "star" as const,
    },
  ];

  let geometricIndex = 0;
  let asciiIndex = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {sceneConfigs.map((scene, index) => {
        const isInScene =
          frame >= scene.startFrame &&
          frame < scene.startFrame + scene.duration;

        if (!isInScene) return null;

        if (scene.type === "geometric") {
          const config = geometricConfigs[geometricIndex % geometricConfigs.length];
          geometricIndex++;
          return (
            <Sequence
              key={`geo-${index}`}
              from={scene.startFrame}
              durationInFrames={scene.duration}
            >
              <BlurTransition
                startFrame={0}
                duration={scene.duration}
              >
                <GeometricAnimation
                  {...config}
                  showGrid={true}
                />
              </BlurTransition>
            </Sequence>
          );
        } else {
          const config = asciiConfigs[asciiIndex % asciiConfigs.length];
          asciiIndex++;
          return (
            <Sequence
              key={`ascii-${index}`}
              from={scene.startFrame}
              durationInFrames={scene.duration}
            >
              <BlurTransition
                startFrame={0}
                duration={scene.duration}
              >
                <AsciiAnimation {...config} />
              </BlurTransition>
            </Sequence>
          );
        }
      })}
    </AbsoluteFill>
  );
};
