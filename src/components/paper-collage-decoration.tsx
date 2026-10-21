"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type CutoutType =
  | "leaf"
  | "maple"
  | "flower"
  | "bud"
  | "strawberry"
  | "orange"
  | "apple"
  | "butterfly"
  | "bee"
  | "bird"
  | "frog"
  | "snail"
  | "mushroom"
  | "bottle"
  | "pot"
  | "recycle"
  | "bag"
  | "compost"
  | "drop"
  | "sprig";

type CutoutDef = {
  type: CutoutType;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number;
  color: string;
  accent?: string;
  float?: boolean;
};

const CUTOUTS: CutoutDef[] = [
  { type: "leaf", pos: [-3.4, -1.6, -2.2], rot: [0.4, 0.6, -0.5], scale: 0.52, color: "#5E9C59" },
  { type: "maple", pos: [3.6, -1.2, -2.4], rot: [0.3, -0.7, 0.6], scale: 0.48, color: "#285C43" },
  { type: "sprig", pos: [-3.2, 0.4, -2.8], rot: [0.2, 0.8, -0.4], scale: 0.44, color: "#A9C49A" },
  { type: "flower", pos: [3.0, 0.8, -3.0], rot: [-0.2, -0.6, 0.5], scale: 0.38, color: "#E7A8B8", accent: "#F2CF62" },
  { type: "bud", pos: [-2.6, 2.0, -3.2], rot: [0.4, 0.5, -0.3], scale: 0.32, color: "#BFE3C0", accent: "#F2CF62" },
  { type: "strawberry", pos: [-3.8, -0.6, -1.8], rot: [0.5, 0.9, -0.6], scale: 0.34, color: "#EA806C", accent: "#5E9C59" },
  { type: "orange", pos: [3.8, -0.4, -1.9], rot: [0.4, -0.8, 0.5], scale: 0.36, color: "#EBA05A", accent: "#5E9C59" },
  { type: "apple", pos: [-2.0, -2.2, -1.6], rot: [0.6, 0.7, -0.4], scale: 0.34, color: "#5E9C59", accent: "#EA806C" },
  { type: "butterfly", pos: [2.4, 1.8, -3.4], rot: [-0.3, -0.7, 0.4], scale: 0.4, color: "#92C9DF", accent: "#BFE3C0" },
  { type: "bee", pos: [-1.4, 1.4, -3.6], rot: [-0.2, 0.8, -0.5], scale: 0.26, color: "#F2CF62", accent: "#285C43" },
  { type: "bird", pos: [1.8, 2.2, -3.0], rot: [-0.4, -0.6, 0.3], scale: 0.32, color: "#5E9C59", accent: "#EBA05A" },
  { type: "frog", pos: [-3.6, -2.2, -1.4], rot: [0.7, 0.6, -0.4], scale: 0.32, color: "#5E9C59", accent: "#BFE3C0" },
  { type: "snail", pos: [3.4, -2.0, -1.6], rot: [0.6, -0.8, 0.5], scale: 0.3, color: "#A9C49A", accent: "#6b4f3a" },
  { type: "mushroom", pos: [-1.0, -1.8, -2.6], rot: [0.5, 0.7, -0.3], scale: 0.3, color: "#EA806C", accent: "#F6F0DF" },
  { type: "bottle", pos: [1.0, -2.0, -2.4], rot: [0.6, -0.6, 0.4], scale: 0.3, color: "#92C9DF", accent: "#F6F0DF" },
  { type: "pot", pos: [-0.4, -2.4, -2.0], rot: [0.7, 0.5, -0.4], scale: 0.3, color: "#BFE3C0", accent: "#285C43" },
  { type: "recycle", pos: [2.0, -1.6, -2.8], rot: [0.4, -0.7, 0.5], scale: 0.28, color: "#285C43" },
  { type: "bag", pos: [0.6, -2.6, -1.8], rot: [0.7, -0.5, 0.4], scale: 0.28, color: "#A9C49A" },
  { type: "compost", pos: [-2.2, -1.8, -2.6], rot: [0.5, 0.8, -0.4], scale: 0.28, color: "#5E9C59" },
  { type: "drop", pos: [1.6, 0.6, -3.6], rot: [-0.3, -0.6, 0.4], scale: 0.22, color: "#92C9DF" },
];

function createFiberTexture(color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(40,40,20,0.06)";
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createShape(type: CutoutType): THREE.Shape {
  const s = new THREE.Shape();
  switch (type) {
    case "leaf":
      s.moveTo(0, 0);
      s.bezierCurveTo(0.6, 0.2, 1.0, 0.8, 0.4, 1.2);
      s.bezierCurveTo(-0.2, 1.0, -0.4, 0.4, 0, 0);
      return s;
    case "maple":
      s.moveTo(0, 0);
      s.bezierCurveTo(0.4, 0.3, 0.6, 0.9, 0, 1.3);
      s.bezierCurveTo(-0.6, 0.9, -0.4, 0.3, 0, 0);
      s.moveTo(0, 0.4);
      s.bezierCurveTo(0.8, 0.5, 0.9, 1.0, 0.2, 1.1);
      s.bezierCurveTo(0.1, 0.9, 0, 0.6, 0, 0.4);
      return s;
    case "sprig":
      s.moveTo(0, 0);
      s.bezierCurveTo(0.2, 0.6, 0.6, 1.0, 0.4, 1.4);
      s.bezierCurveTo(0.8, 1.2, 1.0, 0.8, 0.6, 0.4);
      s.bezierCurveTo(0.3, 0.2, 0.1, 0, 0, 0);
      return s;
    case "flower":
      const r = 0.6;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) s.moveTo(x, y);
        else s.bezierCurveTo(x * 0.6, y * 0.6, x * 0.8, y * 0.8, x, y);
      }
      s.closePath();
      return s;
    case "bud":
      s.moveTo(0, 0);
      s.bezierCurveTo(0.4, 0.1, 0.5, 0.6, 0, 0.8);
      s.bezierCurveTo(-0.5, 0.6, -0.4, 0.1, 0, 0);
      return s;
    case "strawberry":
      s.moveTo(0, 0);
      s.bezierCurveTo(0.5, -0.1, 0.6, 0.5, 0, 0.7);
      s.bezierCurveTo(-0.6, 0.5, -0.5, -0.1, 0, 0);
      return s;
    case "orange":
    case "apple":
      s.absellipse(0, 0.3, 0.5, 0.4, 0, Math.PI * 2, false);
      return s;
    case "butterfly":
      s.moveTo(0, 0);
      s.bezierCurveTo(-0.8, 0.4, -1.0, 1.0, -0.4, 1.2);
      s.bezierCurveTo(0, 0.8, 0, 0.4, 0, 0);
      s.moveTo(0, 0);
      s.bezierCurveTo(0.8, 0.4, 1.0, 1.0, 0.4, 1.2);
      s.bezierCurveTo(0, 0.8, 0, 0.4, 0, 0);
      return s;
    case "bee":
      s.moveTo(-0.4, 0);
      s.bezierCurveTo(-0.5, 0.4, -0.2, 0.6, 0, 0.5);
      s.bezierCurveTo(0.2, 0.6, 0.5, 0.4, 0.4, 0);
      s.bezierCurveTo(0.2, -0.1, -0.2, -0.1, -0.4, 0);
      return s;
    case "bird":
      s.moveTo(-0.5, 0);
      s.bezierCurveTo(0, 0.6, 0.6, 0.4, 0.7, 0.1);
      s.lineTo(0.9, 0.2);
      s.lineTo(0.7, 0);
      s.bezierCurveTo(0.3, -0.1, -0.2, -0.1, -0.5, 0);
      return s;
    case "frog":
      s.absellipse(0, 0.2, 0.5, 0.4, 0, Math.PI * 2, false);
      return s;
    case "snail":
      s.moveTo(-0.4, 0);
      s.bezierCurveTo(-0.5, 0.3, 0, 0.5, 0.4, 0.4);
      s.bezierCurveTo(0.6, 0.2, 0.5, -0.1, 0.2, 0);
      s.bezierCurveTo(0, -0.05, -0.2, -0.05, -0.4, 0);
      return s;
    case "mushroom":
      s.absellipse(0, 0.5, 0.5, 0.3, 0, Math.PI * 2, false);
      s.moveTo(-0.1, 0.5);
      s.lineTo(-0.1, 0.2);
      s.bezierCurveTo(-0.15, 0.1, -0.05, 0.05, 0, 0.05);
      s.bezierCurveTo(0.05, 0.05, 0.15, 0.1, 0.1, 0.2);
      s.lineTo(0.1, 0.5);
      return s;
    case "bottle":
      s.moveTo(-0.12, 0);
      s.lineTo(-0.12, 0.6);
      s.lineTo(-0.08, 0.8);
      s.lineTo(0.08, 0.8);
      s.lineTo(0.12, 0.6);
      s.lineTo(0.12, 0);
      s.bezierCurveTo(0.08, -0.05, -0.08, -0.05, -0.12, 0);
      return s;
    case "pot":
      s.moveTo(-0.4, 0);
      s.lineTo(-0.3, 0.5);
      s.bezierCurveTo(-0.2, 0.6, 0.2, 0.6, 0.3, 0.5);
      s.lineTo(0.4, 0);
      s.bezierCurveTo(0.2, -0.05, -0.2, -0.05, -0.4, 0);
      return s;
    case "recycle":
      s.moveTo(-0.3, -0.2);
      s.lineTo(-0.1, -0.4);
      s.lineTo(0.1, -0.2);
      s.moveTo(-0.05, -0.35);
      s.lineTo(0.25, 0.05);
      s.moveTo(0.3, 0.1);
      s.lineTo(0, 0.1);
      s.moveTo(-0.05, 0.08);
      s.lineTo(-0.25, -0.32);
      s.moveTo(-0.3, -0.38);
      s.lineTo(-0.1, 0.02);
      s.moveTo(-0.05, 0.08);
      s.lineTo(0.25, 0.08);
      s.moveTo(0.3, 0.08);
      s.lineTo(0.1, -0.32);
      s.moveTo(0.05, -0.38);
      s.lineTo(-0.25, -0.38);
      s.moveTo(-0.3, -0.38);
      s.lineTo(-0.1, 0.02);
      s.closePath();
      return s;
    case "bag":
      s.moveTo(-0.4, 0);
      s.lineTo(-0.3, 0.6);
      s.lineTo(0.3, 0.6);
      s.lineTo(0.4, 0);
      s.bezierCurveTo(0.2, -0.05, -0.2, -0.05, -0.4, 0);
      return s;
    case "compost":
      s.moveTo(-0.4, 0);
      s.lineTo(-0.3, 0.5);
      s.lineTo(0.3, 0.5);
      s.lineTo(0.4, 0);
      s.bezierCurveTo(0.2, -0.05, -0.2, -0.05, -0.4, 0);
      return s;
    case "drop":
      s.moveTo(0, -0.6);
      s.bezierCurveTo(0.4, -0.2, 0.5, 0.3, 0, 0.6);
      s.bezierCurveTo(-0.5, 0.3, -0.4, -0.2, 0, -0.6);
      return s;
    default:
      s.absellipse(0, 0, 0.4, 0.3, 0, Math.PI * 2, false);
      return s;
  }
}

function PaperCutout({ def, reduceMotion }: { def: CutoutDef; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const target = useRef(new THREE.Euler(def.rot[0], def.rot[1], def.rot[2]));
  const current = useRef(new THREE.Euler(def.rot[0], def.rot[1], def.rot[2]));
  const { pointer } = useThree();

  const { geometry, material, shadowMat } = useMemo(() => {
    const shape = createShape(def.type);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.008,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.center();
    geo.computeVertexNormals();
    const tex = createFiberTexture(def.color);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: def.color,
      roughness: 0.92,
      metalness: 0,
      bumpMap: tex,
      bumpScale: 0.01,
    });
    const sGeo = new THREE.CircleGeometry(0.6, 32);
    const sMat = new THREE.MeshBasicMaterial({ color: 0x1a3f2f, transparent: true, opacity: 0.16 });
    return { geometry: geo, material: mat, shadowMat: sMat, shadowGeo: sGeo };
  }, [def.type, def.color]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    if (!reduceMotion && !hovered) {
      group.current.position.y = def.pos[1] + Math.sin(t * 0.6 + def.pos[0]) * 0.01;
      group.current.rotation.z = def.rot[2] + Math.sin(t * 0.4) * 0.02;
    }
    if (hovered) {
      const nx = (pointer.x) * 0.18;
      const ny = (pointer.y) * 0.14;
      target.current.set(def.rot[0] - ny, def.rot[1] + nx, def.rot[2] + nx * 0.6);
      group.current.position.z = -1.2;
      group.current.scale.lerp(new THREE.Vector3(def.scale * 1.08, def.scale * 1.08, def.scale * 1.08), delta * 10);
      if (shadowMat) shadowMat.opacity = 0.22;
    } else {
      target.current.set(def.rot[0], def.rot[1], def.rot[2]);
      group.current.position.z = def.pos[2];
      group.current.scale.lerp(new THREE.Vector3(def.scale, def.scale, def.scale), delta * 10);
      if (shadowMat) shadowMat.opacity = 0.16;
    }
    current.current.x = THREE.MathUtils.lerp(current.current.x, target.current.x, delta * 12);
    current.current.y = THREE.MathUtils.lerp(current.current.y, target.current.y, delta * 12);
    current.current.z = THREE.MathUtils.lerp(current.current.z, target.current.z, delta * 12);
    group.current.rotation.x = current.current.x;
    group.current.rotation.y = current.current.y;
    group.current.rotation.z = current.current.z;
  });

  useEffect(() => {
    if (!mesh.current) return;
    mesh.current.userData.type = def.type;
  }, [def.type]);

  return (
    <group
      ref={group}
      position={[def.pos[0], def.pos[1], def.pos[2]]}
      scale={[def.scale, def.scale, def.scale]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh ref={mesh} geometry={geometry} material={material} castShadow receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -0.02]} scale={[0.9, 0.9, 1]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="#1a3f2f" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function Collage() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    queueMicrotask(() => setReduceMotion(mq.matches));
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return (
    <group>
      {CUTOUTS.map((def, i) => (
        <PaperCutout key={i} def={def} reduceMotion={reduceMotion} />
      ))}
    </group>
  );
}

export function PaperCollageDecoration() {
  return (
    <div className="pointer-events-auto fixed inset-0 -z-10">
      <Canvas
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 6], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "auto" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 6]} intensity={1.1} color="#fff7ec" castShadow />
        <directionalLight position={[-4, 4, 4]} intensity={0.5} color="#eaf3ec" />
        <Collage />
      </Canvas>
    </div>
  );
}
