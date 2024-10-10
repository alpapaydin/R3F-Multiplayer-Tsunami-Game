// src/systems/biomes.ts
import { Color } from 'three';

export interface Biome {
  name: string;
  color: Color;
  heightMultiplier: number;
  roughness: number;
}

export const Biomes: Record<string, Biome> = {
  PLAINS: {
    name: 'Plains',
    color: new Color(0x7cfc00),
    heightMultiplier: 0.5,
    roughness: 0.5,
  },
  MOUNTAINS: {
    name: 'Mountains',
    color: new Color(0x808080),
    heightMultiplier: 2,
    roughness: 1,
  },
  DESERT: {
    name: 'Desert',
    color: new Color(0xffd700),
    heightMultiplier: 0.8,
    roughness: 0.3,
  },
  FOREST: {
    name: 'Forest',
    color: new Color(0x228b22),
    heightMultiplier: 1.2,
    roughness: 0.7,
  },
};

export function getBiome(temperature: number, humidity: number): Biome {
  if (temperature > 0.6 && humidity < 0.3) return Biomes.DESERT;
  if (temperature < 0.3 && humidity > 0.6) return Biomes.FOREST;
  if (temperature > 0.7 && humidity > 0.7) return Biomes.MOUNTAINS;
  return Biomes.PLAINS;
}

export function interpolateBiomes(biome1: Biome, biome2: Biome, t: number): Biome {
  return {
    name: t < 0.5 ? biome1.name : biome2.name,
    color: biome1.color.clone().lerp(biome2.color, t),
    heightMultiplier: biome1.heightMultiplier * (1 - t) + biome2.heightMultiplier * t,
    roughness: biome1.roughness * (1 - t) + biome2.roughness * t,
  };
}