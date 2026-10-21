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

  const model = useMemo(
    () =>
      createRenovaDetergentBag({
        atlas: { weightLabel, productCode },
        maxAnisotropy: gl.capabilities.getMaxAnisotropy(),
      }),
    [gl, weightLabel, productCode],
  );

  useEffect(() => {
    return () => model.dispose();
  }, [model]);

  return <primitive object={model.group} />;
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
      dpr={[1, 2]}
      camera={{ position: [1.7, 1.15, 2.95], fov: 32, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      className={className}
    >
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#cbdcbf", 0.6]} />

      <directionalLight
        position={[2.6, 3.6, 3.2]}
        intensity={1.35}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2.2}
        shadow-camera-right={2.2}
        shadow-camera-top={2.2}
        shadow-camera-bottom={-2.2}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0006}
      />
      <directionalLight
        position={[-3.2, 1.8, 2.4]}
        intensity={0.38}
        color="#dcf0e2"
      />
      <directionalLight
        position={[-1.4, 2.6, -3.2]}
        intensity={0.5}
        color="#ffffff"
      />

      {/* Suelo: solo recibe la sombra, para no tapar el fondo de la pagina */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[7, 64]} />
        <shadowMaterial opacity={0.16} color="#204c3b" />
      </mesh>

      <ProductModel weightLabel={weightLabel} productCode={productCode} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.75}
        minDistance={1.8}
        maxDistance={5.5}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.86, 0]}
      />
    </Canvas>
  );
}
