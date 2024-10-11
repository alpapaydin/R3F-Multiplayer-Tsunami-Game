// src/systems/PropSpawner.ts
import { Biome, PropType } from './biomes';
import { createNoise3D } from 'simplex-noise';
import alea from 'alea';

export interface PropInstance {
  type: string;
  position: [number, number, number];
  scale: number;
  rotation: number;
}

export class PropSpawner {
  private propNoise: ReturnType<typeof createNoise3D>;

  constructor(private seed: number) {
    const prng = alea(seed);
    this.propNoise = createNoise3D(prng);
  }

  generatePropsForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number,
    biome: Biome,
    getHeightAt: (x: number, z: number) => number
  ): PropInstance[] {
    const props: PropInstance[] = [];
    const chunkSeed = this.getChunkSeed(chunkX, chunkZ);
    const chunkRng = alea(chunkSeed);
    const propDensity = 0.05;

    for (let x = 0; x < chunkSize; x += 2) {
      for (let z = 0; z < chunkSize; z += 2) {
        const worldX = chunkX * chunkSize + x;
        const worldZ = chunkZ * chunkSize + z;

        const densityValue = (this.propNoise(worldX * 0.02, worldZ * 0.02, chunkSeed * 0.1) + 1) * 0.5;
        if (densityValue < propDensity) {
          const propType = this.selectPropType(biome.props, worldX, worldZ, chunkSeed);
          if (propType) {
            const y = getHeightAt(worldX, worldZ);
            const scale = this.getRandomScale(propType, chunkRng);
            const rotation = chunkRng() * Math.PI * 2;

            const offsetX = chunkRng() * 2;
            const offsetZ = chunkRng() * 2;

            props.push({
              type: propType.name,
              position: [worldX + offsetX, y, worldZ + offsetZ],
              scale,
              rotation,
            });
          }
        }
      }
    }

    return props;
  }

  private getChunkSeed(chunkX: number, chunkZ: number): number {
    return this.seed * 31 + chunkX * 31 * 31 + chunkZ * 31 * 31 * 31;
  }

  private selectPropType(propTypes: PropType[], x: number, z: number, chunkSeed: number): PropType | null {
    const noiseValue = (this.propNoise(x * 0.05, z * 0.05, chunkSeed * 0.1) + 1) * 0.5;
    let cumulativeProbability = 0;

    for (const propType of propTypes) {
      cumulativeProbability += propType.probability;
      if (noiseValue < cumulativeProbability) {
        return propType;
      }
    }

    return null;
  }

  private getRandomScale(propType: PropType, rng: () => number): number {
    return propType.minScale + rng() * (propType.maxScale - propType.minScale);
  }
}