'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export function Scene() {
  const { scene } = useThree();

  useEffect(() => {
    // Set dark background color
    scene.background = new THREE.Color('#0a0a0a');
  }, [scene]);

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />

      {/* Main directional light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        color="#ffffff"
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.3}
        color="#4488ff"
      />

      {/* Point light for highlights */}
      <pointLight position={[0, 15, 0]} intensity={0.5} color="#ff8844" />

      {/* Grid helper on the ground plane */}
      <gridHelper
        args={[20, 20, '#333333', '#222222']}
        position={[0, 0, 0]}
      />

      {/* Central axis line */}
      <Line
        points={[
          [0, 0, 0],
          [0, 15, 0],
        ]}
        color="#444444"
        lineWidth={1}
      />
    </>
  );
}
