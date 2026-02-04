"use client";

import { useState, useMemo } from "react";
import { Player } from "@remotion/player";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { EnhancedGeometric } from "@/remotion/compositions/EnhancedGeometric";
import { AsciiAnimation } from "@/remotion/compositions/AsciiAnimation";
import { WaveField } from "@/remotion/compositions/WaveField";

const geometricShapes = [
  { value: "hexagon", label: "Hexagon" },
  { value: "pentagon", label: "Pentagon" },
  { value: "octagon", label: "Octagon" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "star", label: "Star" },
];

const asciiShapes = [
  { value: "cup", label: "Cup" },
  { value: "heart", label: "Heart" },
  { value: "star", label: "Star" },
];

const wavePatterns = [
  { value: "waves", label: "Waves" },
  { value: "spiral", label: "Spiral" },
  { value: "vortex", label: "Vortex" },
  { value: "terrain", label: "Terrain" },
  { value: "ripple", label: "Ripple" },
  { value: "fabric", label: "Fabric" },
];

const ditherPatterns = [
  { value: "bayer", label: "Bayer" },
  { value: "halftone", label: "Halftone" },
  { value: "lines", label: "Lines" },
  { value: "dots", label: "Dots" },
];

const motionPatterns = [
  { value: "float", label: "Float" },
  { value: "orbital", label: "Orbital" },
  { value: "bounce", label: "Bounce" },
  { value: "wave", label: "Wave" },
  { value: "spiral", label: "Spiral" },
  { value: "chaos", label: "Chaos" },
  { value: "pulse", label: "Pulse" },
];

type AnimationType = "geometric" | "wavefield" | "ascii";
type MotionPattern = "orbital" | "bounce" | "wave" | "spiral" | "chaos" | "pulse" | "float";
type WavePattern = "waves" | "spiral" | "vortex" | "terrain" | "ripple" | "fabric";

export default function Home() {
  const [type, setType] = useState<AnimationType>("wavefield");
  const [shape, setShape] = useState("hexagon");
  const [text, setText] = useState("HELLO");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#ec4899");
  const [duration, setDuration] = useState(10);

  // Multi-shape controls
  const [shapeCount, setShapeCount] = useState(1);
  const [mixShapes, setMixShapes] = useState(false);

  // Effects toggles
  const [enableNoise, setEnableNoise] = useState(true);
  const [enableScanlines, setEnableScanlines] = useState(true);
  const [enableParticles, setEnableParticles] = useState(true);
  const [enableVignette, setEnableVignette] = useState(true);
  const [enableGlitch, setEnableGlitch] = useState(false);
  const [enableDither, setEnableDither] = useState(true);
  const [ditherPattern, setDitherPattern] = useState<"bayer" | "halftone" | "lines" | "dots">("bayer");

  // New effects
  const [enableBloom, setEnableBloom] = useState(true);
  const [enableChromaticAberration, setEnableChromaticAberration] = useState(false);
  const [enableMirror, setEnableMirror] = useState(false);
  const [enableTrails, setEnableTrails] = useState(false);

  // Motion controls
  const [motionPattern, setMotionPattern] = useState<MotionPattern>("float");
  const [motionSpeed, setMotionSpeed] = useState(1);
  const [motionIntensity, setMotionIntensity] = useState(1);

  // WaveField controls
  const [wavePattern, setWavePattern] = useState<WavePattern>("vortex");
  const [lineCount, setLineCount] = useState(40);
  const [amplitude, setAmplitude] = useState(50);
  const [frequency, setFrequency] = useState(3);
  const [waveSpeed, setWaveSpeed] = useState(1);
  const [perspective, setPerspective] = useState(0.6);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);

  const [seed, setSeed] = useState(42);

  const handleTypeChange = (newType: AnimationType) => {
    setType(newType);
    if (newType === "geometric") {
      setShape("hexagon");
      setBackgroundColor("#0a1628");
      setPrimaryColor("#fbbf24");
    } else if (newType === "wavefield") {
      setBackgroundColor("#000000");
      setPrimaryColor("#ffffff");
    } else {
      setShape("cup");
      setBackgroundColor("#0066ff");
    }
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 10000));
  };

  const randomizeAll = () => {
    setSeed(Math.floor(Math.random() * 10000));

    if (type === "geometric") {
      const randomShape = geometricShapes[Math.floor(Math.random() * geometricShapes.length)].value;
      setShape(randomShape);
      setShapeCount(Math.floor(Math.random() * 5) + 1);
      setMixShapes(Math.random() > 0.5);
      const randomMotion = motionPatterns[Math.floor(Math.random() * motionPatterns.length)].value as MotionPattern;
      setMotionPattern(randomMotion);
      setMotionSpeed(0.5 + Math.random() * 2);
      setMotionIntensity(0.5 + Math.random() * 1.5);

      const hue1 = Math.floor(Math.random() * 360);
      const hue2 = (hue1 + 120 + Math.floor(Math.random() * 120)) % 360;
      setPrimaryColor(`hsl(${hue1}, 80%, 60%)`);
      setAccentColor(`hsl(${hue2}, 80%, 60%)`);
      setBackgroundColor(`hsl(${(hue1 + 180) % 360}, 40%, 10%)`);
    } else if (type === "wavefield") {
      const randomWave = wavePatterns[Math.floor(Math.random() * wavePatterns.length)].value as WavePattern;
      setWavePattern(randomWave);
      setLineCount(20 + Math.floor(Math.random() * 40));
      setAmplitude(20 + Math.random() * 80);
      setFrequency(1 + Math.random() * 6);
      setWaveSpeed(0.5 + Math.random() * 2);
      setPerspective(0.3 + Math.random() * 0.5);
      setRotationSpeed(Math.random() * 1.5);

      // Keep it black/white or subtle colors
      if (Math.random() > 0.7) {
        const hue = Math.floor(Math.random() * 360);
        setPrimaryColor(`hsl(${hue}, 60%, 70%)`);
        setBackgroundColor(`hsl(${hue}, 30%, 5%)`);
      } else {
        setPrimaryColor("#ffffff");
        setBackgroundColor("#000000");
      }
    }
  };

  const geometricProps = useMemo(() => ({
    backgroundColor,
    primaryColor,
    accentColor,
    shape: shape as "hexagon" | "pentagon" | "octagon" | "triangle" | "circle" | "square" | "star",
    shapeCount,
    mixShapes,
    enableNoise,
    enableScanlines,
    enableParticles,
    enableVignette,
    enableGlitch,
    enableDither,
    ditherPattern,
    enableBloom,
    enableChromaticAberration,
    enableMirror,
    enableTrails,
    motionPattern,
    motionSpeed,
    motionIntensity,
    seed,
  }), [backgroundColor, primaryColor, accentColor, shape, shapeCount, mixShapes, enableNoise, enableScanlines, enableParticles, enableVignette, enableGlitch, enableDither, ditherPattern, enableBloom, enableChromaticAberration, enableMirror, enableTrails, motionPattern, motionSpeed, motionIntensity, seed]);

  const waveFieldProps = useMemo(() => ({
    backgroundColor,
    lineColor: primaryColor,
    pattern: wavePattern,
    lineCount,
    segmentsPerLine: 100,
    amplitude,
    frequency,
    speed: waveSpeed,
    perspective,
    rotationSpeed,
    enableNoise,
    enableVignette,
    seed,
  }), [backgroundColor, primaryColor, wavePattern, lineCount, amplitude, frequency, waveSpeed, perspective, rotationSpeed, enableNoise, enableVignette, seed]);

  const asciiProps = useMemo(() => ({
    text: text.toUpperCase(),
    backgroundColor,
    textColor: "#ffffff",
    shape: shape as "cup" | "heart" | "star",
  }), [text, backgroundColor, shape]);

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-3xl md:text-4xl font-bold text-transparent">
            Animation Visualizer
          </h1>
          <p className="mt-2 text-slate-400">
            Generate stunning geometric, wave field, and ASCII art animations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Preview - Takes up 2 columns on large screens */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur lg:col-span-2 order-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Preview</CardTitle>
                <Button
                  onClick={randomizeAll}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Randomize All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-700 bg-black">
                {type === "geometric" && (
                  <Player
                    component={EnhancedGeometric}
                    inputProps={geometricProps}
                    durationInFrames={duration * 30}
                    fps={30}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: "100%", height: "100%" }}
                    controls
                    loop
                    autoPlay
                  />
                )}
                {type === "wavefield" && (
                  <Player
                    component={WaveField}
                    inputProps={waveFieldProps}
                    durationInFrames={duration * 30}
                    fps={30}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: "100%", height: "100%" }}
                    controls
                    loop
                    autoPlay
                  />
                )}
                {type === "ascii" && (
                  <Player
                    component={AsciiAnimation}
                    inputProps={asciiProps}
                    durationInFrames={duration * 30}
                    fps={30}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: "100%", height: "100%" }}
                    controls
                    loop
                    autoPlay
                  />
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500 text-center">
                Use screen recording to capture the animation as video
              </p>
            </CardContent>
          </Card>

          {/* Controls - Single column on right */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur order-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Settings</CardTitle>
              <CardDescription className="text-xs">
                Customize your animation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
              <Tabs
                value={type}
                onValueChange={(v) => handleTypeChange(v as AnimationType)}
              >
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="geometric" className="text-xs">Geometric</TabsTrigger>
                  <TabsTrigger value="wavefield" className="text-xs">Wave Field</TabsTrigger>
                  <TabsTrigger value="ascii" className="text-xs">ASCII</TabsTrigger>
                </TabsList>

                <TabsContent value="ascii" className="mt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="text" className="text-xs">Display Text</Label>
                    <Input
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter text"
                      className="bg-slate-800/50 h-8 text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Geometric Shape Selection */}
              {type === "geometric" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Shape</Label>
                  <Select value={shape} onValueChange={setShape}>
                    <SelectTrigger className="bg-slate-800/50 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {geometricShapes.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ASCII Shape Selection */}
              {type === "ascii" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Shape</Label>
                  <Select value={shape} onValueChange={setShape}>
                    <SelectTrigger className="bg-slate-800/50 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {asciiShapes.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Wave Field Controls */}
              {type === "wavefield" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pattern</Label>
                    <Select value={wavePattern} onValueChange={(v) => setWavePattern(v as WavePattern)}>
                      <SelectTrigger className="bg-slate-800/50 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {wavePatterns.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Line Count</Label>
                      <span className="text-xs text-slate-400">{lineCount}</span>
                    </div>
                    <Slider
                      value={[lineCount]}
                      onValueChange={([v]) => setLineCount(v)}
                      min={10}
                      max={80}
                      step={1}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Amplitude</Label>
                        <span className="text-xs text-slate-400">{amplitude.toFixed(0)}</span>
                      </div>
                      <Slider
                        value={[amplitude]}
                        onValueChange={([v]) => setAmplitude(v)}
                        min={10}
                        max={150}
                        step={5}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Frequency</Label>
                        <span className="text-xs text-slate-400">{frequency.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[frequency]}
                        onValueChange={([v]) => setFrequency(v)}
                        min={0.5}
                        max={8}
                        step={0.5}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Speed</Label>
                        <span className="text-xs text-slate-400">{waveSpeed.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[waveSpeed]}
                        onValueChange={([v]) => setWaveSpeed(v)}
                        min={0.1}
                        max={3}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Rotation</Label>
                        <span className="text-xs text-slate-400">{rotationSpeed.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[rotationSpeed]}
                        onValueChange={([v]) => setRotationSpeed(v)}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Perspective</Label>
                      <span className="text-xs text-slate-400">{perspective.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[perspective]}
                      onValueChange={([v]) => setPerspective(v)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>
                </>
              )}

              {/* Geometric Multi-shape controls */}
              {type === "geometric" && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Shape Count</Label>
                      <span className="text-xs text-slate-400">{shapeCount}</span>
                    </div>
                    <Slider
                      value={[shapeCount]}
                      onValueChange={([v]) => setShapeCount(v)}
                      min={1}
                      max={8}
                      step={1}
                    />
                  </div>

                  <button
                    onClick={() => setMixShapes(!mixShapes)}
                    className={`w-full px-3 py-1.5 rounded-md text-xs transition-colors ${
                      mixShapes
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700"
                    }`}
                  >
                    Mix Different Shapes
                  </button>

                  {/* Motion controls */}
                  <div className="border-t border-slate-800 pt-3">
                    <Label className="text-amber-400 mb-2 block text-xs font-medium">Motion Pattern</Label>
                    <Select value={motionPattern} onValueChange={(v) => setMotionPattern(v as MotionPattern)}>
                      <SelectTrigger className="bg-slate-800/50 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {motionPatterns.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Speed</Label>
                          <span className="text-xs text-slate-400">{motionSpeed.toFixed(1)}</span>
                        </div>
                        <Slider
                          value={[motionSpeed]}
                          onValueChange={([v]) => setMotionSpeed(v)}
                          min={0.1}
                          max={3}
                          step={0.1}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Intensity</Label>
                          <span className="text-xs text-slate-400">{motionIntensity.toFixed(1)}</span>
                        </div>
                        <Slider
                          value={[motionIntensity]}
                          onValueChange={([v]) => setMotionIntensity(v)}
                          min={0}
                          max={2}
                          step={0.1}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Color controls */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Background</Label>
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-8 w-full cursor-pointer p-1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{type === "wavefield" ? "Line" : "Primary"}</Label>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-full cursor-pointer p-1"
                  />
                </div>
                {type !== "wavefield" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Accent</Label>
                    <Input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-8 w-full cursor-pointer p-1"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Duration</Label>
                  <span className="text-xs text-slate-400">{duration}s</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={([v]) => setDuration(v)}
                  min={3}
                  max={30}
                  step={1}
                />
              </div>

              {/* Visual Effects for geometric */}
              {type === "geometric" && (
                <>
                  <div className="border-t border-slate-800 pt-3">
                    <Label className="text-amber-400 mb-2 block text-xs font-medium">Visual Effects</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Noise", value: enableNoise, setter: setEnableNoise },
                        { label: "Scanlines", value: enableScanlines, setter: setEnableScanlines },
                        { label: "Particles", value: enableParticles, setter: setEnableParticles },
                        { label: "Vignette", value: enableVignette, setter: setEnableVignette },
                        { label: "Glitch", value: enableGlitch, setter: setEnableGlitch },
                        { label: "Dither", value: enableDither, setter: setEnableDither },
                        { label: "Bloom", value: enableBloom, setter: setEnableBloom },
                        { label: "Chromatic", value: enableChromaticAberration, setter: setEnableChromaticAberration },
                        { label: "Mirror", value: enableMirror, setter: setEnableMirror },
                        { label: "Trails", value: enableTrails, setter: setEnableTrails },
                      ].map((effect) => (
                        <button
                          key={effect.label}
                          onClick={() => effect.setter(!effect.value)}
                          className={`px-2 py-1.5 rounded-md text-xs transition-colors ${
                            effect.value
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800/50 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {effect.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {enableDither && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Dither Pattern</Label>
                      <Select value={ditherPattern} onValueChange={(v) => setDitherPattern(v as typeof ditherPattern)}>
                        <SelectTrigger className="bg-slate-800/50 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ditherPatterns.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* Visual Effects for wavefield */}
              {type === "wavefield" && (
                <div className="border-t border-slate-800 pt-3">
                  <Label className="text-amber-400 mb-2 block text-xs font-medium">Effects</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Noise", value: enableNoise, setter: setEnableNoise },
                      { label: "Vignette", value: enableVignette, setter: setEnableVignette },
                    ].map((effect) => (
                      <button
                        key={effect.label}
                        onClick={() => effect.setter(!effect.value)}
                        className={`px-2 py-1.5 rounded-md text-xs transition-colors ${
                          effect.value
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-slate-800/50 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seed control */}
              {(type === "geometric" || type === "wavefield") && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Seed</Label>
                    <Input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                      className="bg-slate-800/50 h-8 text-sm"
                    />
                  </div>
                  <Button
                    onClick={randomizeSeed}
                    variant="outline"
                    size="sm"
                    className="mt-5"
                  >
                    Dice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Built with Remotion &bull; Use screen recording to export videos
        </p>
      </div>
    </div>
  );
}
