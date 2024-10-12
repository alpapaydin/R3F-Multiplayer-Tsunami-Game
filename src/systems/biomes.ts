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
    heightMultiplier: 4,
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
    roughness: 0.4,
    props: [
      { name: 'Tree', probability: 0.6, minScale: 10, maxScale: 20.5 },
      { name: 'Bush', probability: 0.3, minScale: 0.5, maxScale: 1 },
    ],
  },
};

// Radial falloff function to control how much the mountains "grow" toward the center
function falloff(distance: number): number {
  return Math.pow(1 - distance, 2); // Quadratic falloff for smooth transition
}

// Interpolate between two values using falloff
function interpolateValue(value1: number, value2: number, t: number): number {
  const falloffT = falloff(t);
  return value1 * (1 - falloffT) + value2 * falloffT;
}

export function getBiome(temperature: number, humidity: number, blendFactor: number = 0.3): Biome {
  let biome1: Biome, biome2: Biome;
  let t = 0; // Blending factor

  // Assign primary and secondary biomes based on temperature and humidity ranges
  if (temperature > 0.7 && humidity < 0.3) {
    biome1 = Biomes.DESERT;
    biome2 = Biomes.PLAINS;
    t = (temperature - 0.7) / (0.3 + blendFactor); // Blend wider based on blendFactor
  } else if (temperature < 0.3 && humidity > 0.6) {
    biome1 = Biomes.FOREST;
    biome2 = Biomes.PLAINS;
    t = (humidity - 0.6) / (0.4 + blendFactor); // Blend based on humidity with blendFactor
  } else if (temperature > 0.7 && humidity > 0.7) {
    biome1 = Biomes.MOUNTAINS;
    biome2 = Biomes.PLAINS;
    t = Math.min((temperature - 0.7) / (0.3 + blendFactor), (humidity - 0.7) / (0.3 + blendFactor)); // Blend based on both temperature and humidity
  } else {
    biome1 = Biomes.PLAINS;
    biome2 = Biomes.FOREST;
    t = temperature / (0.7 + blendFactor); // Blend based on temperature with a smoother transition
  }

  // Clamp t between 0 and 1 for safety
  t = Math.max(0, Math.min(1, t));

  // Interpolate between the two biomes' properties using a falloff function
  return interpolateBiomes(biome1, biome2, t);
}

export function interpolateBiomes(biome1: Biome, biome2: Biome, t: number): Biome {
  return {
    name: t < 0.5 ? biome1.name : biome2.name,
    color: biome1.color.clone().lerp(biome2.color, t),  // Blend colors
    heightMultiplier: interpolateValue(biome1.heightMultiplier, biome2.heightMultiplier, t), // Gradual height change with falloff
    roughness: interpolateValue(biome1.roughness, biome2.roughness, t), // Gradual roughness change with falloff
    props: biome1.props.concat(biome2.props) // Combine props from both biomes
  };
}

export function getDominantBiomeProps(temperature: number, humidity: number, blendFactor: number = 0.3): { name: string, props: PropType[] } {
  const biome = getBiome(temperature, humidity, blendFactor);
  return {
    name: biome.name,
    props: biome.props
  };
}
