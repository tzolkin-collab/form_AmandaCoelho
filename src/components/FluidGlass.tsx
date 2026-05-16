"use client";

import * as THREE from "three";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Preload,
  RoundedBox,
  Text,
  useFBO,
  useGLTF,
} from "@react-three/drei";
import { easing } from "maath";

type FluidGlassMode = "lens" | "bar" | "cube";

type GlassProps = {
  scale?: number;
  ior?: number;
  thickness?: number;
  anisotropy?: number;
  chromaticAberration?: number;
  transmission?: number;
  roughness?: number;
  color?: string;
  attenuationColor?: string;
  attenuationDistance?: number;
};

type FluidGlassProps = {
  mode?: FluidGlassMode;
  lensProps?: GlassProps;
  barProps?: GlassProps;
  cubeProps?: GlassProps;
  headline: string;
  caption: string;
  stepLabel: string;
  progress: number;
  accent?: string;
};

type ModeWrapperProps = {
  children: ReactNode;
  glb: string;
  geometryKey: string;
  modeProps?: GlassProps;
  lockToBottom?: boolean;
  followPointer?: boolean;
  progress: number;
};

export default function FluidGlass({
  mode = "lens",
  lensProps = {},
  barProps = {},
  cubeProps = {},
  headline,
  caption,
  stepLabel,
  progress,
  accent = "Venda com intenção",
}: FluidGlassProps) {
  const Wrapper = mode === "bar" ? Bar : mode === "cube" ? Cube : Lens;
  const modeProps = mode === "bar" ? barProps : mode === "cube" ? cubeProps : lensProps;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#140407" }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 15 }} gl={{ alpha: true, antialias: true }}>
        <color attach="background" args={["#140407"]} />
        <fog attach="fog" args={["#140407", 16, 28]} />
        <ambientLight intensity={1.25} />
        <pointLight position={[0, 0, 12]} intensity={35} color="#fff6eb" />
        <pointLight position={[-6, 4, 10]} intensity={16} color="#e0475b" />
        <pointLight position={[6, -3, 9]} intensity={18} color="#f4b58a" />
        <Wrapper modeProps={modeProps} progress={progress}>
          <NarrativeBoard
            headline={headline}
            caption={caption}
            stepLabel={stepLabel}
            progress={progress}
            accent={accent}
          />
        </Wrapper>
        <Preload all />
      </Canvas>
    </div>
  );
}

const ModeWrapper = memo(function ModeWrapper({
  children,
  glb,
  geometryKey,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  progress,
}: ModeWrapperProps) {
  const ref = useRef<THREE.Mesh>(null);
  const { nodes } = useGLTF(glb) as unknown as { nodes: Record<string, THREE.Mesh> };
  const buffer = useFBO();
  const { viewport: viewportState } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(1);

  useEffect(() => {
    scene.background = new THREE.Color("#140407");
  }, [scene]);

  useEffect(() => {
    const geometry = nodes[geometryKey]?.geometry;
    if (!geometry) {
      return;
    }

    geometry.computeBoundingBox();
    if (!geometry.boundingBox) {
      return;
    }

    geoWidthRef.current = geometry.boundingBox.max.x - geometry.boundingBox.min.x || 1;
  }, [geometryKey, nodes]);

  useFrame((state, delta) => {
    if (!ref.current) {
      return;
    }

    const { gl, viewport, pointer, camera, clock } = state;
    const elapsed = clock.getElapsedTime();
    const currentViewport = viewport.getCurrentViewport(camera, [0, 0, 15]);
    const autoX = Math.sin(elapsed * 0.85 + progress * Math.PI) * currentViewport.width * 0.06;
    const autoY = Math.cos(elapsed * 0.55 + progress * Math.PI * 0.65) * currentViewport.height * 0.04;
    const pointerX = followPointer ? pointer.x * currentViewport.width * 0.16 : 0;
    const pointerY = followPointer ? pointer.y * currentViewport.height * 0.12 : 0;
    const destinationX = autoX + pointerX;
    const destinationY = lockToBottom ? -currentViewport.height / 2 + 0.65 : autoY + pointerY;

    easing.damp3(ref.current.position, [destinationX, destinationY, 15], 0.18, delta);
    easing.dampE(ref.current.rotation, [Math.PI / 2, 0, autoX * 0.15], 0.16, delta);

    if (modeProps.scale == null) {
      const maxWorld = currentViewport.width * 0.9;
      const desired = maxWorld / geoWidthRef.current;
      ref.current.scale.setScalar(Math.min(0.16, desired));
    }

    gl.setRenderTarget(buffer);
    gl.setClearColor(new THREE.Color("#140407"), 1);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  const {
    scale,
    ior,
    thickness,
    anisotropy,
    chromaticAberration,
    transmission,
    roughness,
    color,
    attenuationColor,
    attenuationDistance,
  } = modeProps;

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[viewportState.width, viewportState.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent />
      </mesh>
      <mesh ref={ref} scale={scale ?? 0.15} geometry={nodes[geometryKey]?.geometry} rotation={[Math.PI / 2, 0, 0]}>
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 5}
          anisotropy={anisotropy ?? 0.01}
          chromaticAberration={chromaticAberration ?? 0.1}
          transmission={transmission ?? 1}
          roughness={roughness ?? 0}
          color={color ?? "#fffaf7"}
          attenuationColor={attenuationColor ?? "#ffffff"}
          attenuationDistance={attenuationDistance ?? 0.4}
        />
      </mesh>
    </>
  );
});

type VariantProps = {
  modeProps?: GlassProps;
  progress: number;
  children?: ReactNode;
};

function Lens({ modeProps, progress, children }: VariantProps) {
  return (
    <ModeWrapper
      glb="/assets/3d/lens.glb"
      geometryKey="Cylinder"
      followPointer
      modeProps={modeProps}
      progress={progress}
    >
      {children}
    </ModeWrapper>
  );
}

function Cube({ modeProps, progress, children }: VariantProps) {
  return (
    <ModeWrapper
      glb="/assets/3d/cube.glb"
      geometryKey="Cube"
      followPointer
      modeProps={modeProps}
      progress={progress}
    >
      {children}
    </ModeWrapper>
  );
}

function Bar({ modeProps = {}, progress, children }: VariantProps) {
  return (
    <ModeWrapper
      glb="/assets/3d/bar.glb"
      geometryKey="Cube"
      lockToBottom
      followPointer={false}
      modeProps={{
        transmission: 1,
        roughness: 0,
        thickness: 10,
        ior: 1.15,
        color: "#ffffff",
        attenuationColor: "#ffffff",
        attenuationDistance: 0.25,
        ...modeProps,
      }}
      progress={progress}
    >
      {children}
    </ModeWrapper>
  );
}

function NarrativeBoard({
  headline,
  caption,
  stepLabel,
  progress,
  accent,
}: {
  headline: string;
  caption: string;
  stepLabel: string;
  progress: number;
  accent: string;
}) {
  const group = useRef<THREE.Group>(null);
  const accentRef = useRef<THREE.Mesh>(null);
  const cardsRef = useRef<THREE.Group>(null);

  const palette = useMemo(() => ["#2c0b10", "#6e1622", "#a72d38", "#e6b08c", "#fff1e7"], []);

  useFrame((state, delta) => {
    if (group.current) {
      const elapsed = state.clock.getElapsedTime();
      easing.damp3(group.current.position, [0, Math.sin(elapsed * 0.45) * 0.12, 0], 0.12, delta);
      easing.dampE(group.current.rotation, [0, 0, Math.sin(elapsed * 0.3) * 0.08], 0.12, delta);
    }

    if (accentRef.current) {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 1.2 + progress * Math.PI) * 0.08;
      easing.damp3(accentRef.current.scale, [pulse, pulse, pulse], 0.18, delta);
    }

    if (cardsRef.current) {
      cardsRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const baseY = typeof mesh.userData.baseY === "number" ? mesh.userData.baseY : mesh.position.y;
        const baseZ = typeof mesh.userData.baseZ === "number" ? mesh.userData.baseZ : mesh.rotation.z;
        mesh.userData.baseY = baseY;
        mesh.userData.baseZ = baseZ;
        mesh.position.y = baseY + Math.sin(state.clock.getElapsedTime() * (0.45 + index * 0.08) + index) * 0.05;
        mesh.rotation.z = baseZ + Math.sin(state.clock.getElapsedTime() * 0.2 + index) * 0.08;
      });
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <group ref={cardsRef}>
        <RoundedBox args={[6.8, 3.9, 0.2]} radius={0.3} position={[0, 0, 0]} rotation={[0, 0, -0.08]}>
          <meshStandardMaterial color={palette[0]} metalness={0.2} roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[4.2, 2.4, 0.16]} radius={0.28} position={[-1.7, 0.78, 1.4]} rotation={[0, 0, -0.16]}>
          <meshStandardMaterial color={palette[1]} metalness={0.25} roughness={0.65} />
        </RoundedBox>
        <RoundedBox args={[3.2, 1.9, 0.16]} radius={0.26} position={[2.05, -0.95, 2.2]} rotation={[0, 0, 0.12]}>
          <meshStandardMaterial color={palette[2]} metalness={0.25} roughness={0.6} />
        </RoundedBox>
      </group>
      <RoundedBox args={[1.8, 0.44, 0.12]} radius={0.22} position={[-2.1, 1.3, 2.8]} rotation={[0, 0, -0.08]}>
        <meshStandardMaterial color={palette[3]} emissive={palette[3]} emissiveIntensity={0.18} />
      </RoundedBox>
      <mesh ref={accentRef} position={[2.2, 1.25, 2.4]}>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={palette[4]} emissive={palette[4]} emissiveIntensity={0.45} />
      </mesh>
      <Text position={[-2.1, 1.3, 2.91]} fontSize={0.18} color="#2a060a" anchorX="center" anchorY="middle">
        {stepLabel}
      </Text>
      <Text
        position={[0, 0.36, 2.9]}
        fontSize={0.52}
        maxWidth={5.35}
        color="#fff4ec"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        lineHeight={1.05}
      >
        {headline}
      </Text>
      <Text
        position={[0, -0.75, 2.9]}
        fontSize={0.2}
        maxWidth={4.7}
        color="#f2c9af"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        lineHeight={1.3}
      >
        {caption}
      </Text>
      <Text
        position={[1.98, -0.95, 2.95]}
        fontSize={0.15}
        maxWidth={2.2}
        color="#fff4ec"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {accent}
      </Text>
    </group>
  );
}

useGLTF.preload("/assets/3d/lens.glb");
useGLTF.preload("/assets/3d/bar.glb");
useGLTF.preload("/assets/3d/cube.glb");
