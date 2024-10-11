// skins.ts

import { ShaderA, ShaderB, ShaderC, ShaderCool, kale } from '../../shaders/PlayerShaders';
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
  ccc: {
    shader: ShaderCool, // This is the shader defined earlier
    uniforms: {
      time: { value: 0 }, // Uniform for time, driving the animation
      waveAmplitude: { value: 0.05 }, // Amplitude of the wave distortion effect
      waveFrequency: { value: 10.0 }, // Frequency of the wave distortion
      pulseSpeed: { value: 2.0 }, // Speed of the pulsating effect
    },
  },
  kale: {
    shader: kale, // This is the shader defined earlier
    uniforms: {
      time: { value: 0 }, // Uniform for time, driving the kaleidoscope animation
      iResolution: { value: new THREE.Vector2(800, 600) }, // Screen resolution
    },
  },

};
