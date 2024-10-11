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
    console.log(`PropSpawner initialized with seed: ${seed}`);
  }

  async generatePropsForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number,
    biome: Biome,
    getHeightAt: (x: number, z: number) => number
  ): Promise<PropInstance[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const props: PropInstance[] = [];
        const chunkSeed = this.getChunkSeed(chunkX, chunkZ);
        const chunkRng = alea(chunkSeed);
        
        const gridSize = 4; // Adjust this value to control prop density
        const cellSize = chunkSize / gridSize;

        console.log(`Generating props for chunk (${chunkX}, ${chunkZ}), biome: ${biome.name}`);

        for (let gridX = 0; gridX < gridSize; gridX++) {
          for (let gridZ = 0; gridZ < gridSize; gridZ++) {
            const baseX = chunkX * chunkSize + gridX * cellSize;
            const baseZ = chunkZ * chunkSize + gridZ * cellSize;

            // Add some randomness to the position within the grid cell
            const offsetX = chunkRng() * cellSize;
            const offsetZ = chunkRng() * cellSize;

            const worldX = baseX + offsetX;
            const worldZ = baseZ + offsetZ;

            const noiseValue = (this.propNoise(worldX * 0.1, worldZ * 0.1, chunkSeed * 0.1) + 1) * 0.5;
            
            if (noiseValue < 0.3) { // Adjust this threshold to control overall prop density
              const propType = this.selectPropType(biome.props, worldX, worldZ, chunkSeed);
              if (propType) {
                const y = getHeightAt(worldX, worldZ);
                const scale = this.getRandomScale(propType, chunkRng);
                const rotation = chunkRng() * Math.PI * 2;

                props.push({
                  type: propType.name,
                  position: [worldX, y, worldZ],
                  scale,
                  rotation,
                });
              }
            }
          }
        }

        console.log(`Generated ${props.length} props for chunk (${chunkX}, ${chunkZ})`);
        if (props.length === 0) {
          console.warn(`No props generated for chunk (${chunkX}, ${chunkZ}). Biome: ${biome.name}, Prop types:`, biome.props);
        }
        resolve(props);
      }, 0);
    });
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