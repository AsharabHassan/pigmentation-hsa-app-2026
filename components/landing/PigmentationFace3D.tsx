"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AnalysisExplainer.module.css";

// Illustrative masks in canonical model coordinates, never patient measurements.
const masks = `
float oval(vec2 p, vec2 c, vec2 r) { return 1.0-smoothstep(.72,1.0,length((p-c)/r)); }
float pattern(vec3 p) {
  vec2 q=p.xy; float m=0.0;
  if(uPattern<.5) {
    vec2 w=q+vec2(sin(q.y*3.7)*.26,sin(q.x*4.3)*.22);
    m=max(oval(w,vec2(-3.8,-.2),vec2(1.9,1.4)),oval(w,vec2(3.8,-.2),vec2(1.9,1.4)));
    m=max(m,oval(w,vec2(0.,5.5),vec2(2.7,1.1))*.8);
    m=max(m,oval(q,vec2(0.,-2.9),vec2(1.5,.4))*.65);
    m*=.85+.15*sin(q.x*4.+sin(q.y*6.));
  } else if(uPattern<1.5) {
    for(int i=0;i<14;i++){float f=float(i);vec2 c=vec2(sin(f*5.3)*5.1,cos(f*3.7)*3.3+1.5);m=max(m,oval(q,c,vec2(.24+mod(f,3.)*.1,.27+mod(f,2.)*.08)));}
  } else if(uPattern<2.5) {
    for(int i=0;i<14;i++){float f=float(i);vec2 c=vec2((i<7?-1.:1.)*(2.8+sin(f*3.1)*1.3),-2.4+cos(f*2.7)*2.4);m=max(m,oval(q,c,vec2(.38,.5)));}
  } else if(uPattern<3.5) {
    for(int i=0;i<52;i++){float f=float(i);vec2 c=vec2(sin(f*5.3)*5.3,cos(f*3.7)*1.5+.7);m=max(m,oval(q,c,vec2(.11+mod(f,3.)*.025)));}
  } else if(uPattern<4.5) {
    float region=max(oval(q,vec2(-3.6,.4),vec2(2.3,3.)),oval(q,vec2(3.6,.4),vec2(2.3,3.)));
    region=max(region,oval(q,vec2(0.,5.6),vec2(4.,1.8)));
    m=region*smoothstep(-.4,.6,sin(q.x*3.+sin(q.y*2.))*cos(q.y*3.));
  } else {
    m=max(oval(q,vec2(-3.15,1.4),vec2(1.65,.65)),oval(q,vec2(3.15,1.4),vec2(1.65,.65)));
  }
  return m*smoothstep(.3,2.7,p.z);
}`;
const vertexSource = `
precision mediump float;
attribute vec3 aPosition; attribute vec3 aNormal;
uniform float uAngle; uniform float uAspect; uniform float uPattern;
varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
${masks}
void main(){
  float c=cos(uAngle),s=sin(uAngle); mat3 turn=mat3(c,0.,-s,0.,1.,0.,s,0.,c);
  vec3 p=aPosition+aNormal*pattern(aPosition)*.13;
  p.z-=2.; p=turn*p; p.y+=.5;
  float perspective=1.0-p.z/55.;
  gl_Position=vec4(p.x/(11.5*uAspect*perspective),p.y/(11.5*perspective),-p.z/40.,1.);
  vPosition=aPosition; vNormal=turn*aNormal; vView=p;
}`;
const fragmentSource = `
precision mediump float;
uniform float uPattern; uniform float uWire;
varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
${masks}
void main(){
  vec3 n=normalize(vNormal); float diffuse=max(dot(n,normalize(vec3(-.5,.8,1.))),0.);
  float fill=max(dot(n,normalize(vec3(.8,-.2,.4))),0.);
  float spec=pow(max(dot(reflect(-normalize(vec3(-.5,.8,1.)),n),vec3(0.,0.,1.)),0.),32.);
  float m=pattern(vPosition);
  vec3 skin=vec3(.78,.68,.51),pigment=vec3(.43,.22,.10);
  vec3 base=mix(skin,pigment,m*.88);
  vec3 color=base*(.24+.77*diffuse+.22*fill)+spec*.15;
  float rim=pow(1.-abs(n.z),3.);color+=vec3(.58,.42,.22)*rim*.26;
  if(uWire>.5)gl_FragColor=vec4(.95,.79,.48,.1);else gl_FragColor=vec4(color,1.);
}`;

function geometry(source: string) {
  const vertices: number[][] = [], faces: number[][] = [];
  for (const line of source.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") vertices.push(parts.slice(1, 4).map(Number));
    if (parts[0] === "f") faces.push(parts.slice(1, 4).map(value => Number(value.split("/")[0]) - 1));
  }
  if (vertices.length < 400 || faces.length < 500) throw new Error("Invalid face geometry");
  // Midpoint subdivision makes raised illustrative patches smooth at this scale.
  let triangles = faces;
  for (let pass = 0; pass < 2; pass++) {
    const edges = new Map<string, number>();
    const midpoint = (a: number, b: number) => {
      const key = [Math.min(a, b), Math.max(a, b)].join(":");
      const existing = edges.get(key); if (existing !== undefined) return existing;
      const index = vertices.length;
      vertices.push(vertices[a].map((value, axis) => (value + vertices[b][axis]) / 2));
      edges.set(key, index); return index;
    };
    triangles = triangles.flatMap(([a, b, c]) => {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      return [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]];
    });
  }
  const normals = vertices.map(() => [0, 0, 0]);
  for (const [a, b, c] of triangles) {
    const u = vertices[b].map((value, axis) => value - vertices[a][axis]);
    const v = vertices[c].map((value, axis) => value - vertices[a][axis]);
    const n = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    for (const i of [a,b,c]) n.forEach((value, axis) => normals[i][axis] += value);
  }
  return { positions: new Float32Array(vertices.flat()), normals: new Float32Array(normals.flatMap(n => { const length = Math.hypot(...n) || 1; return n.map(v => v / length); })), indices: new Uint16Array(triangles.flat()), lines: new Uint16Array(faces.flatMap(([a,b,c]) => [a,b,b,c,c,a])) };
}

export function PigmentationFace3D({ pattern, angle, running }: { pattern: number; angle: number; running: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ pattern, angle, running });
  const draw = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { state.current = { pattern, angle, running }; draw.current?.(); }, [pattern, angle, running]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const abort = new AbortController();
    const buffers: WebGLBuffer[] = [], shaders: WebGLShader[] = [];
    let gl: WebGLRenderingContext | null = null, program: WebGLProgram | null = null;
    let frame = 0, observer: ResizeObserver | undefined;
    const onLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); setFailed(true); };
    element.addEventListener("webglcontextlost", onLost);
    async function init() {
      try {
        const response = await fetch("/models/canonical-face.obj", { signal: abort.signal });
        if (!response.ok) throw new Error("Face unavailable");
        const mesh = geometry(await response.text());
        if (abort.signal.aborted) return;
        gl = element!.getContext("webgl", { antialias: true, alpha: true, powerPreference: "low-power" });
        if (!gl) throw new Error("WebGL unavailable");
        const context = gl;
        const compile = (kind: number, source: string) => {
          const shader = context.createShader(kind)!; shaders.push(shader);
          context.shaderSource(shader, source); context.compileShader(shader);
          if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error(context.getShaderInfoLog(shader) || "Shader unavailable");
          return shader;
        };
        program = context.createProgram()!;
        context.attachShader(program, compile(context.VERTEX_SHADER, vertexSource));
        context.attachShader(program, compile(context.FRAGMENT_SHADER, fragmentSource));
        context.linkProgram(program);
        if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error(context.getProgramInfoLog(program) || "Renderer unavailable");
        context.useProgram(program);
        for (const [name, data] of [["aPosition", mesh.positions], ["aNormal", mesh.normals]] as const) {
          const buffer = context.createBuffer()!; buffers.push(buffer);
          context.bindBuffer(context.ARRAY_BUFFER, buffer); context.bufferData(context.ARRAY_BUFFER, data, context.STATIC_DRAW);
          const location = context.getAttribLocation(program, name); context.enableVertexAttribArray(location); context.vertexAttribPointer(location, 3, context.FLOAT, false, 0, 0);
        }
        const indexBuffer = context.createBuffer()!; buffers.push(indexBuffer);
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer); context.bufferData(context.ELEMENT_ARRAY_BUFFER, mesh.indices, context.STATIC_DRAW);
        const lineBuffer = context.createBuffer()!; buffers.push(lineBuffer);
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, lineBuffer); context.bufferData(context.ELEMENT_ARRAY_BUFFER, mesh.lines, context.STATIC_DRAW);
        const uniforms = Object.fromEntries(["uAngle","uAspect","uPattern","uWire"].map(key => [key, context.getUniformLocation(program!, key)]));
        const render = () => {
          cancelAnimationFrame(frame);
          if (abort.signal.aborted || context.isContextLost()) return;
          const { width, height } = element!.getBoundingClientRect();
          const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
          const w = Math.max(1, Math.round(width*ratio)), h = Math.max(1, Math.round(height*ratio));
          if (element!.width !== w || element!.height !== h) { element!.width = w; element!.height = h; }
          context.viewport(0,0,w,h); context.clearColor(0,0,0,0); context.clear(context.COLOR_BUFFER_BIT|context.DEPTH_BUFFER_BIT);
          context.enable(context.DEPTH_TEST); context.enable(context.BLEND); context.blendFunc(context.SRC_ALPHA,context.ONE_MINUS_SRC_ALPHA);
          const sway = state.current.running ? Math.sin(performance.now()/2600)*.12 : 0;
          context.uniform1f(uniforms.uAngle,state.current.angle*Math.PI/180+sway); context.uniform1f(uniforms.uAspect,w/h); context.uniform1f(uniforms.uPattern,state.current.pattern);
          context.uniform1f(uniforms.uWire,0); context.bindBuffer(context.ELEMENT_ARRAY_BUFFER,indexBuffer);
          context.enable(context.POLYGON_OFFSET_FILL); context.polygonOffset(1,1); context.drawElements(context.TRIANGLES,mesh.indices.length,context.UNSIGNED_SHORT,0); context.disable(context.POLYGON_OFFSET_FILL);
          context.uniform1f(uniforms.uWire,1); context.bindBuffer(context.ELEMENT_ARRAY_BUFFER,lineBuffer); context.drawElements(context.LINES,mesh.lines.length,context.UNSIGNED_SHORT,0);
          if (state.current.running) frame=requestAnimationFrame(render);
        };
        draw.current = render; observer = new ResizeObserver(render); observer.observe(element!); render(); setFailed(false);
      } catch (error) { if (!abort.signal.aborted) { console.warn("[face-explorer]", error instanceof Error ? error.message : "Renderer unavailable"); setFailed(true); } }
    }
    void init();
    return () => { abort.abort(); cancelAnimationFrame(frame); observer?.disconnect(); draw.current=null; element.removeEventListener("webglcontextlost",onLost); buffers.forEach(buffer=>gl?.deleteBuffer(buffer)); shaders.forEach(shader=>gl?.deleteShader(shader)); if(program)gl?.deleteProgram(program); };
  }, []);
  return <><canvas ref={canvas} className={styles.faceCanvas} role="img" aria-label="Rotatable illustrative 3D face with example pigmentation overlays" />{failed && <p className={styles.webglFallback}>The interactive 3D view is unavailable on this device. Explore the six pattern descriptions alongside it.</p>}</>;
}
