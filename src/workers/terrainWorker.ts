// src/workers/terrainWorker.ts

/* eslint-disable no-restricted-globals */
// The above line disables the ESLint rule for this file

// Declare the worker scope

import { createNoise2D } from 'simplex-noise';
import { getBiome } from '../systems/biomes';
declare const self: Worker;


const heightNoise = createNoise2D();
const temperatureNoise = createNoise2D();
const humidityNoise = createNoise2D();

self.onmessage = (e: MessageEvent) => {
  const { chunkX, chunkZ, chunkSize, resolution, heightScale, noiseScale } = e.data;

  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = (i / resolution) * chunkSize;
      const z = (j / resolution) * chunkSize;
      const worldX = chunkX * chunkSize + x;
      const worldZ = chunkZ * chunkSize + z;

      const temperature = (temperatureNoise(worldX * 0.001, worldZ * 0.001) + 1) * 0.5;
      const humidity = (humidityNoise(worldX * 0.001, worldZ * 0.001) + 1) * 0.5;
      const biome = getBiome(temperature, humidity);

      const heightValue = (heightNoise(worldX * noiseScale, worldZ * noiseScale) + 1) * 0.5;
      const height = heightValue * heightScale * biome.heightMultiplier;

      vertices.push(x, height, z);
      colors.push(biome.color.r, biome.color.g, biome.color.b);

      if (i < resolution && j < resolution) {
        const a = i * (resolution + 1) + j;
        const b = i * (resolution + 1) + j + 1;
        const c = (i + 1) * (resolution + 1) + j;
        const d = (i + 1) * (resolution + 1) + j + 1;
        indices.push(a, b, d, a, d, c);
      }
    }
  }

  self.postMessage({ vertices, colors, indices });
};