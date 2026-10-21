"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createRenovaDetergentBag } from "./create-renova-bag";

/**
 * Visor 3D del producto RENOVA.
 * La escena usa Three.js real: malla con UV propio, cierre independiente,
 * luz principal con sombras y OrbitControls.
 */

function ProductModel({
  weightLabel,
  productCode,
}: {
  weightLabel: string;
  productCode: string;
}) {
  const gl = useThree((state) => state.gl);
  const groupRef = useMemo(() => {
    const g = new THREE.Group();
    g.rotation.y = -0.38;
    return g;
  }, []);

  const model = useMemo(
    () =>
      createRenovaDetergentBag({
        atlas: { weightLabel, productCode },
        maxAnisotropy: gl.capabilities.getMaxAnisotropy(),
      }),
    [gl, weightLabel, productCode],
  );

  useEffect(() => {
    groupRef.add(model.group);
    return () => {
      groupRef.clear();
      model.dispose();
    };
  }, [groupRef, model]);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      groupRef.rotation.y += 0.0032;
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [groupRef]);

  return <primitive object={groupRef} />;
}

export type ProductViewerProps = {
  weightLabel?: string;
  productCode?: string;
  className?: string;
};

export function ProductViewer({
  weightLabel = "5 kg",
  productCode = "REN-DET-005",
  className,
}: ProductViewerProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [1.9, 1.08, 2.3], fov: 25, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.98;
      }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      className={className}
    >
      <ambientLight intensity={0.46} />
      <hemisphereLight args={["#f7f3e8", "#dce7d2", 0.56]} />

      <directionalLight
        position={[3.2, 4.2, 3.4]}
        intensity={1.24}
        color="#fff7ec"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={1.6}
        shadow-camera-bottom={-1.6}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-2.8, 2.2, 2.4]}
        intensity={0.36}
        color="#eaf3ec"
      />
      <directionalLight
        position={[0, 2.8, -3.2]}
        intensity={0.26}
        color="#ffffff"
      />

      {/* Suelo: solo recibe la sombra, para no tapar el fondo de la pagina */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[5, 48]} />
        <shadowMaterial opacity={0.16} color="#1a3f2f" />
      </mesh>

      <ProductModel weightLabel={weightLabel} productCode={productCode} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={false}
        enableDamping={false}
        minDistance={1.4}
        maxDistance={3.2}
        target={[0, 0.82, 0]}
      />
    </Canvas>
  );
}
