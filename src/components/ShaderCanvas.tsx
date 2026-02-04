"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

type ShaderPatternType =
  | "hypnotic"
  | "voronoi"
  | "kaleidoscope"
  | "plasma"
  | "tunnel"
  | "fractal"
  | "moire"
  | "waves"
  | "psychedelic"
  | "vortex"
  | "diagonalWaves";

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

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

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

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }

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

  vec2 voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float minDist = 1.0;
    vec2 minPoint = vec2(0.0);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 neighbor = vec2(float(i), float(j));
        vec2 point = hash2(n + neighbor + vec2(u_seed)) + 0.5 * sin(u_time * 0.5 + TAU * hash2(n + neighbor + vec2(u_seed)));
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

  vec3 mixColors(float t) {
    if (t < 0.5) {
      return mix(u_colorA, u_colorB, t * 2.0);
    } else {
      return mix(u_colorB, u_colorC, (t - 0.5) * 2.0);
    }
  }

  // Rainbow color from hue
  vec3 rainbow(float t) {
    vec3 c = vec3(t * 6.0);
    c = clamp(abs(mod(c + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c;
  }

  // Psychedelic spiral pattern (Reference image 1)
  vec3 psychedelicPattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_zoom * 2.0;

    float r = length(p);
    float a = atan(p.y, p.x);

    float t = u_time * u_speed * 0.5;

    // Number of spiral arms
    float arms = floor(u_symmetry + 0.5);
    if (arms < 1.0) arms = 8.0;

    // Create wavy spiral pattern
    float wave = sin(r * 15.0 * u_complexity - t * 3.0) * 0.3;
    float spiral = a * arms / TAU + r * 2.0 * u_complexity - t;
    spiral += wave;

    // Create color bands
    float band = fract(spiral);

    // Add secondary wave distortion
    float distort = sin(a * arms * 2.0 + r * 10.0 - t * 2.0) * 0.1;
    band = fract(band + distort);

    // Rainbow colors cycling through bands
    float hue = band + t * 0.2;
    vec3 color = rainbow(fract(hue));

    // Add brightness variation
    float brightness = 0.7 + 0.3 * sin(band * TAU * 2.0);
    color *= brightness;

    return color;
  }

  // Smooth vortex tunnel (Reference image 2)
  vec3 vortexPattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float r = length(p);
    float a = atan(p.y, p.x);

    float t = u_time * u_speed;

    // Number of rays
    float rays = floor(u_symmetry + 0.5);
    if (rays < 4.0) rays = 12.0;

    // Create spiral twist that increases toward center
    float twist = (1.0 / (r + 0.1)) * u_complexity * 0.5;
    float spiral = a + twist - t * 0.5;

    // Create ray pattern
    float ray = sin(spiral * rays) * 0.5 + 0.5;

    // Smooth the rays
    ray = smoothstep(0.3, 0.7, ray);

    // Color based on angle for rainbow effect
    float hue = a / TAU + 0.5 + t * 0.1;
    vec3 baseColor = rainbow(fract(hue));

    // Background color (white/cream)
    vec3 bgColor = vec3(0.95, 0.93, 0.9);

    // Mix ray color with background
    vec3 color = mix(bgColor, baseColor, ray);

    // Darken toward center for depth
    float centerDark = smoothstep(0.0, 0.3, r);
    color *= 0.3 + 0.7 * centerDark;

    // Add subtle glow at center
    color += vec3(0.8, 0.9, 1.0) * (1.0 - smoothstep(0.0, 0.15, r)) * 0.5;

    return color;
  }

  // Diagonal wave pattern (Reference image 3)
  vec3 diagonalWavesPattern(vec2 uv) {
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_zoom;

    // Rotate to diagonal
    float angle = u_rotation + PI * 0.25;
    p *= rot(angle);

    float t = u_time * u_speed;

    // Wave parameters
    float waveFreq = u_complexity * 20.0;
    float waveAmp = 0.03 / u_complexity;

    // Create parallel wavy lines
    float wave = sin(p.x * 8.0 + t) * waveAmp;
    float linePattern = p.y + wave;

    // Create line grid
    float lineSpacing = 0.05 / u_complexity;
    float line = abs(fract(linePattern / lineSpacing) - 0.5) * 2.0;

    // Smooth the lines
    float lineWidth = 0.3;
    float lineMask = 1.0 - smoothstep(lineWidth - 0.1, lineWidth + 0.1, line);

    // Add secondary wave for more organic feel
    float wave2 = sin(p.x * 12.0 - t * 0.7 + p.y * 5.0) * waveAmp * 0.5;
    lineMask *= 1.0 + wave2 * 5.0;
    lineMask = clamp(lineMask, 0.0, 1.0);

    // Colors
    vec3 lineColor = vec3(0.85, 0.85, 0.85);
    vec3 bgColor = vec3(0.1, 0.1, 0.12);

    // Add subtle noise texture
    if (u_noise) {
      float n = noise(p * 100.0 + t);
      lineMask *= 0.8 + 0.4 * n;
    }

    vec3 color = mix(bgColor, lineColor, lineMask * 0.8);

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
    vec3 color;
    if (u_pattern == 0) color = hypnoticPattern(uv);
    else if (u_pattern == 1) color = voronoiPattern(uv);
    else if (u_pattern == 2) color = kaleidoscopePattern(uv);
    else if (u_pattern == 3) color = plasmaPattern(uv);
    else if (u_pattern == 4) color = tunnelPattern(uv);
    else if (u_pattern == 5) color = fractalPattern(uv);
    else if (u_pattern == 6) color = moirePattern(uv);
    else if (u_pattern == 7) color = wavesPattern(uv);
    else if (u_pattern == 8) color = psychedelicPattern(uv);
    else if (u_pattern == 9) color = vortexPattern(uv);
    else if (u_pattern == 10) color = diagonalWavesPattern(uv);
    else color = hypnoticPattern(uv);

    if (u_noise && u_pattern != 10) {
      float grain = hash(uv * 1000.0 + u_time) * 0.05;
      color += grain - 0.025;
    }
    float vignette = 1.0 - length(v_uv - 0.5) * 0.3;
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
  psychedelic: 8,
  vortex: 9,
  diagonalWaves: 10,
};

export interface ShaderCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const ShaderCanvas = forwardRef<ShaderCanvasHandle, ShaderCanvasProps>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));
  const stateRef = useRef<{
    gl: WebGLRenderingContext | null;
    program: WebGLProgram | null;
    animationId: number;
    startTime: number;
  }>({
    gl: null,
    program: null,
    animationId: 0,
    startTime: 0,
  });
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wait for canvas to have dimensions
    const initWebGL = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        requestAnimationFrame(initWebGL);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });

      if (!gl) {
        console.error("WebGL not supported");
        return;
      }

      // Compile shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Vertex shader:", gl.getShaderInfoLog(vertexShader));
        return;
      }

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Fragment shader:", gl.getShaderInfoLog(fragmentShader));
        return;
      }

      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Link:", gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      // Fullscreen quad
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.viewport(0, 0, canvas.width, canvas.height);

      stateRef.current = {
        gl,
        program,
        animationId: 0,
        startTime: performance.now(),
      };

      // Start render loop
      const render = () => {
        const { gl, program, startTime } = stateRef.current;
        const p = propsRef.current;

        if (!gl || !program) return;

        if (!p.paused) {
          const time = (performance.now() - startTime) / 1000;

          gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
          gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
          gl.uniform1i(gl.getUniformLocation(program, "u_pattern"), patternIndexMap[p.pattern] ?? 0);
          gl.uniform1f(gl.getUniformLocation(program, "u_speed"), p.speed);
          gl.uniform1f(gl.getUniformLocation(program, "u_complexity"), p.complexity);
          gl.uniform3fv(gl.getUniformLocation(program, "u_colorA"), hexToRgb(p.colorA));
          gl.uniform3fv(gl.getUniformLocation(program, "u_colorB"), hexToRgb(p.colorB));
          gl.uniform3fv(gl.getUniformLocation(program, "u_colorC"), hexToRgb(p.colorC));
          gl.uniform1f(gl.getUniformLocation(program, "u_symmetry"), p.symmetry);
          gl.uniform1f(gl.getUniformLocation(program, "u_zoom"), p.zoom);
          gl.uniform1f(gl.getUniformLocation(program, "u_rotation"), p.rotation * Math.PI / 180);
          gl.uniform1f(gl.getUniformLocation(program, "u_seed"), p.seed);
          gl.uniform1i(gl.getUniformLocation(program, "u_noise"), p.enableNoise ? 1 : 0);

          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        stateRef.current.animationId = requestAnimationFrame(render);
      };

      stateRef.current.animationId = requestAnimationFrame(render);

      // Resize handler
      const resizeObserver = new ResizeObserver(() => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      });
      resizeObserver.observe(canvas);

      return () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(stateRef.current.animationId);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      };
    };

    const cleanup = initWebGL();
    return () => {
      cancelAnimationFrame(stateRef.current.animationId);
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", background: "#000" }}
    />
  );
});

ShaderCanvas.displayName = "ShaderCanvas";

export default ShaderCanvas;
