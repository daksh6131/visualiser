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

const geometricShapes = [
  { value: "hexagon", label: "Hexagon" },
  { value: "pentagon", label: "Pentagon" },
  { value: "octagon", label: "Octagon" },
  { value: "triangle", label: "Triangle" },
  { value: "circle", label: "Circle" },
];

const asciiShapes = [
  { value: "cup", label: "Cup" },
  { value: "heart", label: "Heart" },
  { value: "star", label: "Star" },
];

const ditherPatterns = [
  { value: "bayer", label: "Bayer" },
  { value: "halftone", label: "Halftone" },
  { value: "lines", label: "Lines" },
  { value: "dots", label: "Dots" },
];

export default function Home() {
  const [type, setType] = useState<"geometric" | "ascii">("geometric");
  const [shape, setShape] = useState("hexagon");
  const [text, setText] = useState("HELLO");
  const [backgroundColor, setBackgroundColor] = useState("#0a1628");
  const [primaryColor, setPrimaryColor] = useState("#fbbf24");
  const [accentColor, setAccentColor] = useState("#ec4899");
  const [duration, setDuration] = useState(10);

  // Effects toggles
  const [enableNoise, setEnableNoise] = useState(true);
  const [enableScanlines, setEnableScanlines] = useState(true);
  const [enableParticles, setEnableParticles] = useState(true);
  const [enableVignette, setEnableVignette] = useState(true);
  const [enableGlitch, setEnableGlitch] = useState(false);
  const [enableDither, setEnableDither] = useState(true);
  const [ditherPattern, setDitherPattern] = useState<"bayer" | "halftone" | "lines" | "dots">("bayer");
  const [seed, setSeed] = useState(42);

  const handleTypeChange = (newType: "geometric" | "ascii") => {
    setType(newType);
    if (newType === "geometric") {
      setShape("hexagon");
      setBackgroundColor("#0a1628");
    } else {
      setShape("cup");
      setBackgroundColor("#0066ff");
    }
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 10000));
  };

  const shapes = type === "geometric" ? geometricShapes : asciiShapes;


  const geometricProps = useMemo(() => ({
    backgroundColor,
    primaryColor,
    accentColor,
    shape: shape as "hexagon" | "pentagon" | "octagon" | "triangle" | "circle",
    enableNoise,
    enableScanlines,
    enableParticles,
    enableVignette,
    enableGlitch,
    enableDither,
    ditherPattern,
    seed,
  }), [backgroundColor, primaryColor, accentColor, shape, enableNoise, enableScanlines, enableParticles, enableVignette, enableGlitch, enableDither, ditherPattern, seed]);

  const asciiProps = useMemo(() => ({
    text: text.toUpperCase(),
    backgroundColor,
    textColor: "#ffffff",
    shape: shape as "cup" | "heart" | "star",
  }), [text, backgroundColor, shape]);

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-3xl md:text-4xl font-bold text-transparent">
            Animation Visualizer
          </h1>
          <p className="mt-2 text-slate-400">
            Generate stunning geometric and ASCII art animations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur order-1 lg:order-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-700 bg-black">
                {type === "geometric" ? (
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
                ) : (
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

          {/* Controls */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur order-2 lg:order-1">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Customize your animation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Tabs
                value={type}
                onValueChange={(v) => handleTypeChange(v as "geometric" | "ascii")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="geometric">Geometric</TabsTrigger>
                  <TabsTrigger value="ascii">ASCII Art</TabsTrigger>
                </TabsList>

                <TabsContent value="ascii" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="text">Display Text</Label>
                    <Input
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter text"
                      className="bg-slate-800/50"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Shape</Label>
                <Select value={shape} onValueChange={setShape}>
                  <SelectTrigger className="bg-slate-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shapes.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Background</Label>
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-full cursor-pointer p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Primary</Label>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-full cursor-pointer p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Accent</Label>
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-full cursor-pointer p-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Duration</Label>
                  <span className="text-sm text-slate-400">{duration}s</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={([v]) => setDuration(v)}
                  min={3}
                  max={30}
                  step={1}
                />
              </div>

              {type === "geometric" && (
                <>
                  <div className="border-t border-slate-800 pt-4">
                    <Label className="text-amber-400 mb-3 block">Visual Effects</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Noise", value: enableNoise, setter: setEnableNoise },
                        { label: "Scanlines", value: enableScanlines, setter: setEnableScanlines },
                        { label: "Particles", value: enableParticles, setter: setEnableParticles },
                        { label: "Vignette", value: enableVignette, setter: setEnableVignette },
                        { label: "Glitch", value: enableGlitch, setter: setEnableGlitch },
                        { label: "Dither", value: enableDither, setter: setEnableDither },
                      ].map((effect) => (
                        <button
                          key={effect.label}
                          onClick={() => effect.setter(!effect.value)}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
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
                    <div className="space-y-2">
                      <Label>Dither Pattern</Label>
                      <Select value={ditherPattern} onValueChange={(v) => setDitherPattern(v as typeof ditherPattern)}>
                        <SelectTrigger className="bg-slate-800/50">
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

                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <Label>Randomization Seed</Label>
                      <Input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                        className="bg-slate-800/50"
                      />
                    </div>
                    <Button
                      onClick={randomizeSeed}
                      variant="outline"
                      className="mt-6"
                    >
                      🎲
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Built with Remotion &bull; Use screen recording to export videos
        </p>
      </div>
    </div>
  );
}
