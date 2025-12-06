import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useStore } from '../store/useStore';

// Vertex Shader
const vertexShader = `
uniform float uTime;
uniform float uVolume;
uniform float uHasImage; 

attribute float aRandom;
attribute float aSize;
attribute vec3 aColor; // Custom color from image

varying vec3 vColor;
varying float vDistance;

void main() {
  vec3 pos = position;
  
  // -- Audio Reaction Logic --
  float audioExp = uVolume * 4.0; 
  
  if (uHasImage > 0.5) {
    // IMAGE MODE:
    // Displace z-axis based on brightness (assuming lighter colors are "higher")
    float brightness = (aColor.r + aColor.g + aColor.b) / 3.0;
    
    // Static float + Audio bump
    pos.z += brightness * 2.0; 
    pos.z += sin(uTime * 2.0 + pos.x) * 0.2; // Gentle wave
    
    // Beat kick: Move pixels towards camera based on audio volume
    pos.z += audioExp * (0.5 + brightness); 
    
    // Slight noise
    pos.x += cos(uTime + pos.y * 10.0) * 0.02 * uVolume;

  } else {
    // SPHERE MODE (Default):
    float breath = sin(uTime * 0.5 + aRandom * 5.0) * 0.2;
    pos.x += cos(uTime * aRandom + pos.y) * 0.1 * (1.0 + audioExp);
    pos.y += sin(uTime * aRandom + pos.x) * 0.1 * (1.0 + audioExp);
    pos.z += sin(uTime * aRandom + pos.z) * 0.1 * (1.0 + audioExp);
    pos = pos * (1.0 + breath + audioExp * 0.5);
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation
  float sizeMult = uHasImage > 0.5 ? 2.0 : 1.0;
  gl_PointSize = (aSize * sizeMult * (1.0 + uVolume * 2.0)) * (20.0 / -mvPosition.z);
  
  vDistance = length(pos);
  vColor = aColor;
}
`;

// Fragment Shader
const fragmentShader = `
uniform float uVolume;
uniform float uHasImage;
varying vec3 vColor;
varying float vDistance;

void main() {
  // Circular particle
  float r = distance(gl_PointCoord, vec2(0.5));
  if (r > 0.5) discard;

  float glow = 1.0 - (r * 2.0);
  glow = pow(glow, 2.0);

  vec3 finalColor;

  if (uHasImage > 0.5) {
    // Use the color sampled from the image, make it brighter based on audio
    finalColor = vColor * (1.0 + uVolume * 1.5);
    // Add a slight tech-blue tint overlay on loud beats
    finalColor += vec3(0.2, 0.4, 1.0) * uVolume * 0.5;
  } else {
    // Default abstract colors
    vec3 baseColor = vec3(0.4, 0.6, 1.0); 
    vec3 activeColor = vec3(1.0, 0.4, 0.6); 
    finalColor = mix(baseColor, activeColor, uVolume + sin(vDistance * 2.0) * 0.2);
  }

  gl_FragColor = vec4(finalColor, glow * 0.9);
}
`;

const Particles = () => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { isRecording, backgroundImage } = useStore();
  const { getAudioData } = useAudioAnalyzer(isRecording);

  // Buffer state
  const [geometryData, setGeometryData] = useState<{
    positions: Float32Array;
    sizes: Float32Array;
    randoms: Float32Array;
    colors: Float32Array;
  } | null>(null);

  // Generate Default Sphere Particles
  const generateSphere = () => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 2.5 + (Math.random() * 0.5);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = Math.random() * 2.0;
      randoms[i] = Math.random();
      
      // Default colors (ignored by shader in Sphere mode, but needed for attribute)
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    }
    return { positions, sizes, randoms, colors };
  };

  // Generate Particles from Image
  useEffect(() => {
    if (!backgroundImage) {
      setGeometryData(generateSphere());
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = backgroundImage;
    
    img.onload = () => {
      // Create a canvas to read pixel data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Downsample for performance (approx 100x100 grid = 10k particles)
      const maxSize = 120; 
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const particles = [];
      
      // Iterate pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const a = data[i + 3] / 255;

          // Skip transparent or very dark pixels to create a "shape"
          if (a > 0.1 && (r + g + b) > 0.1) {
            particles.push({
              x: (x / width - 0.5) * 8, // Center and scale
              y: -(y / height - 0.5) * 8 * (height/width), // Flip Y, scale aspect
              z: 0,
              r, g, b,
              size: Math.random() * 1.5 + 0.5
            });
          }
        }
      }

      const count = particles.length;
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const randoms = new Float32Array(count);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        
        sizes[i] = p.size;
        randoms[i] = Math.random();
        
        colors[i * 3] = p.r;
        colors[i * 3 + 1] = p.g;
        colors[i * 3 + 2] = p.b;
      }

      setGeometryData({ positions, sizes, randoms, colors });
    };

  }, [backgroundImage]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVolume: { value: 0 },
    uHasImage: { value: 0 }
  }), []);

  useFrame((state) => {
    const { clock } = state;
    const { volume } = getAudioData();

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // Lerp volume
      const currentVol = materialRef.current.uniforms.uVolume.value;
      materialRef.current.uniforms.uVolume.value = THREE.MathUtils.lerp(currentVol, volume, 0.1);
      
      // Switch mode
      materialRef.current.uniforms.uHasImage.value = backgroundImage ? 1.0 : 0.0;
    }

    if (meshRef.current && !backgroundImage) {
      // Only rotate broadly in sphere mode, keep image mostly steady
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    } else if (meshRef.current && backgroundImage) {
       // Gentle sway for image
       meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  if (!geometryData) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={geometryData.positions.length / 3}
          array={geometryData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={geometryData.sizes.length}
          array={geometryData.sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={geometryData.randoms.length}
          array={geometryData.randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={geometryData.colors.length}
          array={geometryData.colors}
          itemSize={3}
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