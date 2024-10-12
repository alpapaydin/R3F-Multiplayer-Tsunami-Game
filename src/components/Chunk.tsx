import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Biome } from '../systems/biomes';
import { PropSpawner, PropInstance } from '../systems/PropSpawner';
import Prop from './Props/Prop';

interface ChunkProps {
  position: [number, number, number];
  size: number;
  resolution: number;
  heightScale: number;
  noiseScale: number;
  heightNoise: (x: number, y: number) => number;
  getBiomeAt: (x: number, z: number) => Biome;
  propSpawner: PropSpawner;
  chunkKey: string;
  material: THREE.Material;
}

const Chunk: React.FC<ChunkProps> = ({
  position,
  size,
  resolution,
  heightScale,
  noiseScale,
  heightNoise,
  getBiomeAt,
  propSpawner,
  chunkKey,
  material,
}) => {
  const [chunkX, _, chunkZ] = position;
  const [props, setProps] = useState<PropInstance[]>([]);

  const geometry = useMemo(() => {
    console.log(`Generating geometry for chunk ${chunkKey}`);
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

        // Generate additional noise for height variation
        const biome = getBiomeAt(worldX, worldZ);
        const randomNoise = heightNoise(worldX * noiseScale * 0.5, worldZ * noiseScale * 0.5);
        // Add some randomness to the height, scaled by the biome roughness
        const variation = (randomNoise * biome.roughness) * 0.8; // Adjust 0.2 to control randomness intensity
        const heightValue = (heightNoise(worldX * noiseScale, worldZ * noiseScale) + 1) * biome.roughness;
        const height = (heightValue + variation) * heightScale * biome.heightMultiplier;


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
  }, [position, size, resolution, heightScale, noiseScale, heightNoise, getBiomeAt, chunkKey]);

  useEffect(() => {
    const generateProps = async () => {
      console.log(`Generating props for chunk ${chunkKey}`);
      const chunkProps = await propSpawner.generatePropsForChunk(
        chunkX / size,
        chunkZ / size,
        size,
        getBiomeAt(chunkX, chunkZ),
        (x, z) => heightNoise(x * noiseScale, z * noiseScale) * heightScale
      );
      console.log(`Generated ${chunkProps.length} props for chunk ${chunkKey}`);
      setProps(chunkProps);
    };

    generateProps();
  }, [chunkX, chunkZ, size, getBiomeAt, heightNoise, noiseScale, heightScale, propSpawner, chunkKey]);

  const groupedProps = useMemo(() => {
    return props.reduce((acc, prop) => {
      if (!acc[prop.type]) {
        acc[prop.type] = [];
      }
      acc[prop.type].push(prop);
      return acc;
    }, {} as Record<string, PropInstance[]>);
  }, [props]);

  useEffect(() => {
    console.log(`Chunk ${chunkKey} rendered with ${props.length} props`);
    console.log('Grouped props:', groupedProps);
  }, [chunkKey, props, groupedProps]);

  return (
    <>
      <mesh geometry={geometry} material={material} position={position} />
      {Object.entries(groupedProps).map(([type, instances]) => (
        <Prop key={`${chunkKey}-${type}`} type={type} instances={instances} />
      ))}
    </>
  );
};

export default Chunk;