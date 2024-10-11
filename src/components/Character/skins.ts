// skins.ts

import { ShaderA, ShaderB, ShaderC } from '../../shaders/PlayerShaders';
import * as THREE from 'three';

type SkinTemplate = {
  shader: {
    vertexShader: string;
    fragmentShader: string;
  };
  uniforms: {
    [uniformName: string]: { value: any };
  };
};

// Define skins and their shaders/uniforms
export const skins: Record<string, SkinTemplate> = {
  default: {
    shader: ShaderA,
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0x0055ff) }, // Default blue color
    },
  },
  rainbow: {
    shader: ShaderB,
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xffa500) }, // Orange color
    },
  },
  glow: {
    shader: ShaderC,
    uniforms: {
      time: { value: 0 },
      glowIntensity: { value: 1.0 }, // Custom uniform for glow shader
    },
  },
  // Add more skins as needed
};
