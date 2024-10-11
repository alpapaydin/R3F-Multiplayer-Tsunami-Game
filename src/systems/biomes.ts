// src/systems/biomes.ts
import { Color } from 'three';

export interface PropType {
  name: string;
  probability: number;
  minScale: number;
  maxScale: number;
}

export interface Biome {
  name: string;
  color: Color;
  heightMultiplier: number;
  roughness: number;
  props: PropType[];
}

export const Biomes: Record<string, Biome> = {
  PLAINS: {
    name: 'Plains',
    color: new Color(0x7cfc00),
    heightMultiplier: 0.5,
    roughness: 0.5,
    props: [
      { name: 'Grass', probability: 0.7, minScale: 10.0, maxScale: 20.5 },
      { name: 'Bush', probability: 0.2, minScale: 0.8, maxScale: 1.2 },
    ],
  },
  MOUNTAINS: {
    name: 'Mountains',
    color: new Color(0x808080),
    heightMultiplier: 2,
    roughness: 1,
    props: [
      { name: 'Rock', probability: 0.6, minScale: 0.5, maxScale: 2 },
      { name: 'Pine', probability: 0.3, minScale: 1, maxScale: 3 },
    ],
  },
  DESERT: {
    name: 'Desert',
    color: new Color(0xffd700),
    heightMultiplier: 0.8,
    roughness: 0.3,
    props: [
      { name: 'Cactus', probability: 0.3, minScale: 0.8, maxScale: 1.5 },
      { name: 'DesertRock', probability: 0.4, minScale: 0.5, maxScale: 1.2 },
    ],
  },
  FOREST: {
    name: 'Forest',
    color: new Color(0x228b22),
    heightMultiplier: 1.2,
    roughness: 0.7,
    props: [
      { name: 'Tree', probability: 0.6, minScale: 10, maxScale: 20.5 },
      { name: 'Bush', probability: 0.3, minScale: 0.5, maxScale: 1 },
    ],
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
    props: t < 0.5 ? biome1.props : biome2.props, // Use props from the dominant biome
  };
}