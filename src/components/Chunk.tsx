import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Biome } from '../systems/biomes';  // Updated import path

interface ChunkProps {
  position: [number, number, number];
  size: number;
  resolution: number;
  heightScale: number;
  noiseScale: number;
  heightNoise: (x: number, y: number) => number;
  getBiomeAt: (x: number, z: number) => Biome;
}

const Chunk: React.FC<ChunkProps> = ({
  position,
  size,
  resolution,
  heightScale,
  noiseScale,
  heightNoise,
  getBiomeAt,
}) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = (i / resolution) * size;
        const z = (j / resolution) * size;
        const worldX = position[0] + x;
        const worldZ = position[2] + z;

        const biome = getBiomeAt(worldX, worldZ);
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

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [position, size, resolution, heightScale, noiseScale, heightNoise, getBiomeAt]);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.8,
  }), []);

  return <mesh geometry={geometry} material={material} position={position} />;
};

export default Chunk;