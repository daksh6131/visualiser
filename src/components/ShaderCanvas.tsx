"use client";

import React, { useEffect, useRef, useCallback } from "react";

type ShaderPatternType =
  | "hypnotic"
  | "voronoi"
  | "kaleidoscope"
  | "plasma"
  | "tunnel"
  | "fractal"
  | "moire"
  | "waves";

interface ShaderCanvasProps {
  pattern: ShaderPatternType;
  speed: number;
  complexity: number;
  colorA: string;
  colorB: string;
  colorC: string;
  symmetry: number;
  zoom: number;
  rotation: number;
  enableNoise: boolean;
  seed: number;
  paused?: boolean;
}

// Convert hex to RGB normalized
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
};

// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader - optimized for real-time
const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform int u_pattern;
  uniform float u_speed;
  uniform float u_complexity;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;
  uniform float u_symmetry;
  uniform float u_zoom;
  uniform float u_rotation;
  uniform float u_seed;
  uniform bool u_noise;

  #define PI 3.14159265359
  #define TAU 6.28318530718
  #define PHI 1.61803398875

  // Fast hash
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Optimized noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // FBM with fewer octaves for performance
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Voronoi
  vec2 voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float minDist = 1.0;
    vec2 minPoint = vec2(0.0);

    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 neighbor = vec2(float(i), float(j));
        vec2 point = hash(n + neighbor + u_seed) + 0.5 * sin(u_time * 0.5 + TAU * hash(n + neighbor));
        point = 0.5 + 0.5 * sin(u_time * 0.3 + TAU * point);
        vec2 diff = neighbor + point - f;
        float dist = length(diff);
        if (dist < minDist) {
          minDist = dist;
          minPoint = point;
        }
      }
    }
    return vec2(minDist, hash(minPoint));
  }

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  float ease(float t) {
    return t * t * (3.0 - 2.0 * t);
  }

  // Color mixing helper
  vec3 mixColors(float t) {
    vec3 color;
    if (t < 0.5) {
      color = mix(u_colorA, u_colorB, t * 2.0);
    } else {
      color = mix(u_colorB, u_colorC, (t - 0.5) * 2.0);
    }
    return color;
  }

  vec3 hypnoticPattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p *= u_zoom;
    p *= rot(u_rotation + u_time * 0.1 * u_speed);

    float r = length(p);
    float a = atan(p.y, p.x);

    float sym = floor(u_symmetry + 0.5);
    if (sym > 1.0) {
      a = mod(a + PI, TAU / sym) - PI / sym;
      a = abs(a);
    }

    float rings = sin(r * 20.0 * u_complexity - u_time * 2.0 * u_speed);
    float spiral = sin(a * sym + r * 10.0 - u_time * u_speed);
    float pattern = rings * 0.5 + spiral * 0.5;
    float secondary = sin(r * 30.0 * u_complexity + a * sym * 2.0 + u_time * u_speed);
    pattern = mix(pattern, secondary, 0.3);
    pattern = ease((pattern + 1.0) * 0.5);

    return mixColors(pattern);
  }

  vec3 voronoiPattern(vec2 uv) {
    vec2 p = (uv - 0.5) * u_zoom * 5.0;
    p *= rot(u_rotation + u_time * 0.05 * u_speed);

    float a = atan(p.y, p.x);
    float r = length(p);
    float sym = floor(u_symmetry + 0.5);
    if (sym > 1.0) {
      a = mod(a + PI, TAU / sym) - PI / sym;
      p = vec2(cos(a), sin(a)) * r;
    }

    vec2 v = voronoi(p * u_complexity);
    float pattern = ease(v.x);
    float colorShift = v.y + u_time * 0.1 * u_speed;

    vec3 color;
    float t = fract(colorShift);
    if (t < 0.333) {
      color = mix(u_colorA, u_colorB, t * 3.0);
    } else if (t < 0.666) {
      color = mix(u_colorB, u_colorC, (t - 0.333) * 3.0);
    } else {
      color = mix(u_colorC, u_colorA, (t - 0.666) * 3.0);
    }

    float edge = smoothstep(0.0, 0.1, pattern);
    return mix(u_colorA * 0.2, color, edge);
  }

  vec3 kaleidoscopePattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p *= u_zoom;
    p *= rot(u_rotation);

    float r = length(p);
    float a = atan(p.y, p.x);

    float sym = max(3.0, floor(u_symmetry + 0.5));
    float segment = TAU / sym;
    a = mod(a + PI, segment);
    a = abs(a - segment * 0.5);
    p = vec2(cos(a), sin(a)) * r;

    float t = u_time * u_speed;
    float pattern = 0.0;

    for (float i = 1.0; i <= 4.0; i++) {
      vec2 q = p * (i * u_complexity);
      q += vec2(sin(t * 0.5 + i), cos(t * 0.3 + i)) * 0.2;
      pattern += sin(q.x * 10.0 + t) * cos(q.y * 10.0 - t * 0.7) / i;
    }

    pattern = ease((pattern + 2.0) / 4.0);
    return mixColors(pattern);
  }

  vec3 plasmaPattern(vec2 uv) {
    vec2 p = (uv - 0.5) * u_zoom * 4.0;
    p *= rot(u_rotation + u_time * 0.02 * u_speed);

    float t = u_time * u_speed;
    float v = 0.0;
    v += sin(p.x * u_complexity + t);
    v += sin(p.y * u_complexity * PHI + t * 0.7);
    v += sin((p.x + p.y) * u_complexity * 0.5 + t * 0.5);
    v += sin(length(p) * u_complexity * 2.0 - t);

    if (u_noise) {
      v += fbm(p + t * 0.2) * 2.0;
    }

    v = ease((v + 5.0) / 10.0);

    float colorT = fract(v + t * 0.1);
    vec3 color;
    if (colorT < 0.333) {
      color = mix(u_colorA, u_colorB, colorT * 3.0);
    } else if (colorT < 0.666) {
      color = mix(u_colorB, u_colorC, (colorT - 0.333) * 3.0);
    } else {
      color = mix(u_colorC, u_colorA, (colorT - 0.666) * 3.0);
    }
    return color;
  }

  vec3 tunnelPattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p *= rot(u_rotation);

    float r = length(p);
    float a = atan(p.y, p.x);
    float depth = 1.0 / (r + 0.1) * u_zoom;
    float tunnelA = a;

    float sym = floor(u_symmetry + 0.5);
    if (sym > 1.0) {
      tunnelA = mod(tunnelA + PI, TAU / sym) - PI / sym;
    }

    float t = u_time * u_speed;
    depth += t * 2.0;
    tunnelA += t * 0.2;

    float pattern = sin(depth * u_complexity * 5.0) * 0.5 + 0.5;
    pattern *= sin(tunnelA * sym * 2.0 + depth * 0.5) * 0.5 + 0.5;

    float fade = smoothstep(0.0, 0.3, r);
    pattern *= fade;
    pattern = ease(pattern);

    vec3 color = mixColors(pattern);
    color += u_colorC * (1.0 - fade) * 0.5;
    return color;
  }

  vec3 fractalPattern(vec2 uv) {
    vec2 p = (uv - 0.5) * u_zoom * 3.0;
    p *= rot(u_rotation + u_time * 0.05 * u_speed);

    float t = u_time * u_speed;
    vec2 z = p;
    vec2 c = vec2(sin(t * 0.1) * 0.4, cos(t * 0.13) * 0.4);

    float iter = 0.0;
    for (int i = 0; i < 20; i++) {
      if (length(z) > 2.0) break;
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      iter += 1.0;
    }

    float pattern = iter / 20.0;
    pattern = ease(pattern);

    float a = atan(p.y, p.x);
    float sym = floor(u_symmetry + 0.5);
    float symPattern = sin(a * sym + pattern * TAU + t) * 0.5 + 0.5;
    pattern = mix(pattern, symPattern, 0.3);

    return mixColors(pattern);
  }

  vec3 moirePattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p *= u_zoom;

    float t = u_time * u_speed;
    vec2 c1 = vec2(sin(t * 0.3) * 0.2, cos(t * 0.2) * 0.2);
    vec2 c2 = vec2(sin(t * 0.4 + 2.0) * 0.2, cos(t * 0.3 + 1.0) * 0.2);
    vec2 c3 = vec2(sin(t * 0.2 + 4.0) * 0.2, cos(t * 0.4 + 3.0) * 0.2);

    float freq = u_complexity * 30.0;
    float r1 = sin(length(p - c1) * freq);
    float r2 = sin(length(p - c2) * freq);
    float r3 = sin(length(p - c3) * freq);

    float pattern = (r1 + r2 + r3) / 3.0;

    float a = atan(p.y, p.x);
    float sym = floor(u_symmetry + 0.5);
    if (sym > 1.0) {
      float symRings = sin(length(p) * freq + a * sym);
      pattern = (pattern + symRings) * 0.5;
    }

    pattern = ease((pattern + 1.0) * 0.5);
    return mixColors(pattern);
  }

  vec3 wavesPattern(vec2 uv) {
    vec2 p = (uv - 0.5) * u_zoom * 4.0;
    p *= rot(u_rotation);

    float t = u_time * u_speed;
    float a = atan(p.y, p.x);
    float r = length(p);
    float sym = floor(u_symmetry + 0.5);
    if (sym > 1.0) {
      a = mod(a + PI, TAU / sym) - PI / sym;
      a = abs(a);
      p = vec2(cos(a), sin(a)) * r;
    }

    float pattern = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
      float angle = i * TAU / 5.0 + t * 0.1;
      vec2 dir = vec2(cos(angle), sin(angle));
      pattern += sin(dot(p, dir) * u_complexity * 5.0 + t * (1.0 + i * 0.2));
    }
    pattern += sin(r * u_complexity * 8.0 - t * 2.0);

    pattern = ease((pattern + 6.0) / 12.0);
    return mixColors(pattern);
  }

  void main() {
    vec2 uv = v_uv;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 color;

    if (u_pattern == 0) color = hypnoticPattern(uv);
    else if (u_pattern == 1) color = voronoiPattern(uv);
    else if (u_pattern == 2) color = kaleidoscopePattern(uv);
    else if (u_pattern == 3) color = plasmaPattern(uv);
    else if (u_pattern == 4) color = tunnelPattern(uv);
    else if (u_pattern == 5) color = fractalPattern(uv);
    else if (u_pattern == 6) color = moirePattern(uv);
    else color = wavesPattern(uv);

    if (u_noise) {
      float grain = hash(uv * 1000.0 + u_time) * 0.05;
      color += grain - 0.025;
    }

    float vignette = 1.0 - length(v_uv - 0.5) * 0.5;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const patternIndexMap: Record<ShaderPatternType, number> = {
  hypnotic: 0,
  voronoi: 1,
  kaleidoscope: 2,
  plasma: 3,
  tunnel: 4,
  fractal: 5,
  moire: 6,
  waves: 7,
};

export const ShaderCanvas: React.FC<ShaderCanvasProps> = ({
  pattern = "hypnotic",
  speed = 1,
  complexity = 1,
  colorA = "#00ffff",
  colorB = "#ff0066",
  colorC = "#000000",
  symmetry = 3,
  zoom = 1,
  rotation = 0,
  enableNoise = false,
  seed = 42,
  paused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Store props in refs for animation loop
  const propsRef = useRef({
    pattern,
    speed,
    complexity,
    colorA,
    colorB,
    colorC,
    symmetry,
    zoom,
    rotation,
    enableNoise,
    seed,
  });

  // Update props ref when props change
  useEffect(() => {
    propsRef.current = {
      pattern,
      speed,
      complexity,
      colorA,
      colorB,
      colorC,
      symmetry,
      zoom,
      rotation,
      enableNoise,
      seed,
    };
  }, [pattern, speed, complexity, colorA, colorB, colorC, symmetry, zoom, rotation, enableNoise, seed]);

  // Render function
  const render = useCallback((time: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    const props = propsRef.current;
    const elapsed = (time - startTimeRef.current) / 1000;

    gl.useProgram(program);

    // Set uniforms
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), elapsed * props.speed);
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
    gl.uniform1i(gl.getUniformLocation(program, "u_pattern"), patternIndexMap[props.pattern]);
    gl.uniform1f(gl.getUniformLocation(program, "u_speed"), props.speed);
    gl.uniform1f(gl.getUniformLocation(program, "u_complexity"), props.complexity);
    gl.uniform3fv(gl.getUniformLocation(program, "u_colorA"), hexToRgb(props.colorA));
    gl.uniform3fv(gl.getUniformLocation(program, "u_colorB"), hexToRgb(props.colorB));
    gl.uniform3fv(gl.getUniformLocation(program, "u_colorC"), hexToRgb(props.colorC));
    gl.uniform1f(gl.getUniformLocation(program, "u_symmetry"), props.symmetry);
    gl.uniform1f(gl.getUniformLocation(program, "u_zoom"), props.zoom);
    gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), props.rotation * Math.PI / 180);
    gl.uniform1f(gl.getUniformLocation(program, "u_seed"), props.seed);
    gl.uniform1i(gl.getUniformLocation(program, "u_noise"), props.enableNoise ? 1 : 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, []);

  // Animation loop
  const animate = useCallback((time: number) => {
    render(time);
    animationRef.current = requestAnimationFrame(animate);
  }, [render]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = Math.min(window.devicePixelRatio, 2); // Cap DPR for performance
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        if (glRef.current) {
          glRef.current.viewport(0, 0, canvas.width, canvas.height);
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    glRef.current = gl;

    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error("Vertex shader error:", gl.getShaderInfoLog(vertexShader));
      return;
    }

    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fragmentShader));
      return;
    }

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    // Create fullscreen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set initial canvas size
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Start animation
    startTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [animate]);

  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      pausedTimeRef.current = performance.now();
      cancelAnimationFrame(animationRef.current);
    } else {
      // Adjust start time to account for pause duration
      if (pausedTimeRef.current > 0) {
        startTimeRef.current += performance.now() - pausedTimeRef.current;
      }
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [paused, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};

export default ShaderCanvas;
