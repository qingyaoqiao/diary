import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useStore } from '../store/useStore';

// Vertex Shader: Handles particle position and size breathing
const vertexShader = `
uniform float uTime;
uniform float uVolume;
attribute float aRandom;
attribute float aSize;

varying vec3 vColor;
varying float vDistance;

// Simple noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec3 pos = position;
  
  // Basic breathing
  float breath = sin(uTime * 0.5 + aRandom * 5.0) * 0.2;
  
  // Audio reaction: Expand outwards based on volume
  float audioExp = uVolume * 2.5; 
  
  // Turbulence
  pos.x += cos(uTime * aRandom + pos.y) * 0.1 * (1.0 + audioExp);
  pos.y += sin(uTime * aRandom + pos.x) * 0.1 * (1.0 + audioExp);
  pos.z += sin(uTime * aRandom + pos.z) * 0.1 * (1.0 + audioExp);
  
  // Apply expansion from center
  pos = pos * (1.0 + breath + audioExp * 0.5);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation
  gl_PointSize = (aSize * (1.0 + uVolume * 3.0)) * (20.0 / -mvPosition.z);
  
  vDistance = length(pos);
}
`;

// Fragment Shader: Handles particle color and glow
const fragmentShader = `
uniform float uVolume;
varying float vDistance;

void main() {
  // Circular particle shape
  float r = distance(gl_PointCoord, vec2(0.5));
  if (r > 0.5) discard;

  // Soft glow edge
  float glow = 1.0 - (r * 2.0);
  glow = pow(glow, 2.0);

  // Color logic
  vec3 baseColor = vec3(0.4, 0.6, 1.0); // Blueish
  vec3 activeColor = vec3(1.0, 0.4, 0.6); // Pinkish
  
  // Mix based on volume and distance from center
  vec3 finalColor = mix(baseColor, activeColor, uVolume + sin(vDistance * 2.0) * 0.2);

  gl_FragColor = vec4(finalColor, glow * 0.8);
}
`;

const Particles = () => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { isRecording } = useStore();
  const { getAudioData } = useAudioAnalyzer(isRecording);

  // Generate particle data
  const count = 4000;
  const [positions, sizes, randoms] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 2.5 + (Math.random() * 0.5);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = Math.random() * 2.0;
      randoms[i] = Math.random();
    }
    return [positions, sizes, randoms];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVolume: { value: 0 }
  }), []);

  useFrame((state) => {
    const { clock } = state;
    const { volume } = getAudioData();

    if (materialRef.current) {
      // Smoothly interpolate volume for jitter-free animation
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // Lerp volume for smoothness
      const currentVol = materialRef.current.uniforms.uVolume.value;
      materialRef.current.uniforms.uVolume.value = THREE.MathUtils.lerp(currentVol, volume, 0.1);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Particles;