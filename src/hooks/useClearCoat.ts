import { useEffect, type RefObject } from 'react'

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

/*
 * Мягкие вытянутые студийные блики, медленно проходящие по кадру.
 * Слой накладывается режимом screen, поэтому шейдер выдаёт почти чёрное
 * изображение и лишь подсвечивает отдельные полосы — так он добавляет
 * движение свету на лаке, не перекрашивая саму фотографию.
 */
const FRAG = `
precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

// Одна вытянутая полоса света с мягкими краями.
float streak(vec2 uv, float offset, float width, float speed) {
  float x = uv.x + uv.y * 0.55 + offset - uTime * speed;
  float band = fract(x);
  float d = min(band, 1.0 - band);
  return smoothstep(width, 0.0, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = uv;
  p.x *= uResolution.x / uResolution.y;

  // Указатель слегка смещает светящуюся зону — свет «следит» за курсором.
  vec2 toPointer = uv - uPointer;
  float focus = smoothstep(0.85, 0.0, length(toPointer));

  float grain = fbm(p * 3.0 + vec2(uTime * 0.05, uTime * 0.02));

  float light = 0.0;
  light += streak(p, 0.10, 0.055, 0.035) * 0.85;
  light += streak(p, 0.52, 0.030, 0.021) * 0.55;
  light += streak(p, 0.78, 0.085, 0.013) * 0.40;

  light *= 0.55 + 0.75 * grain;
  light *= 0.45 + 0.85 * focus;

  // Края кадра гасим, чтобы слой не подсвечивал рамку сцены.
  float vignette = smoothstep(1.05, 0.35, length(uv - 0.5) * 1.35);
  light *= vignette * uIntensity;

  vec3 tint = mix(vec3(0.80, 0.87, 0.92), vec3(1.0, 0.99, 0.96), grain);
  gl_FragColor = vec4(tint * light, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

type Options = {
  /** Указатель в нормализованных координатах сцены. */
  pointer?: RefObject<{ x: number; y: number }>
  intensity?: number
  enabled?: boolean
}

/**
 * Рисует слой бликов в canvas. Кадры считаются только когда сцена видна,
 * DPR ограничен двойкой — один canvas на страницу, без нагрузки на FPS.
 */
export function useClearCoat(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { pointer, intensity = 1, enabled = true }: Options = {},
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !enabled) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const program = gl.createProgram()
    if (!vs || !fs || !program) return

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uPointer = gl.getUniformLocation(program, 'uPointer')
    const uIntensity = gl.getUniformLocation(program, 'uIntensity')

    const resize = (force = false) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      } else if (!force) {
        return
      }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uResolution, w, h)
    }

    let frame = 0
    let visible = true
    // Кадр могут запланировать и сам цикл, и IntersectionObserver. Флага
    // достаточно, чтобы ни один из них не отрисовался после удаления программы.
    let alive = true
    const start = performance.now()

    const render = () => {
      if (!alive) return
      // Программа и буфер переустанавливаются каждый кадр: в StrictMode эффект
      // монтируется дважды на один и тот же контекст, и без этого uniform'ы
      // уходят в чужую программу — контекст сыплет INVALID_OPERATION.
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      resize(true)
      gl.uniform1f(uIntensity, intensity)
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      const p = pointer?.current
      gl.uniform2f(uPointer, p ? p.x : 0.5, p ? 1 - p.y : 0.5)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (visible) frame = requestAnimationFrame(render)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = visible
        visible = entry.isIntersecting
        if (visible && !wasVisible) frame = requestAnimationFrame(render)
        if (!visible) cancelAnimationFrame(frame)
      },
      { threshold: 0 },
    )
    observer.observe(canvas)
    frame = requestAnimationFrame(render)

    return () => {
      alive = false
      observer.disconnect()
      cancelAnimationFrame(frame)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [canvasRef, pointer, intensity, enabled])
}
