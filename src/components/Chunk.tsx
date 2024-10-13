import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Biome } from '../systems/biomes';
import { PropSpawner, PropInstance } from '../systems/PropSpawner';
import Prop from './Props/Prop';
import Food from './Props/Food';

interface ChunkProps {
  position: [number, number, number];
  size: number;
  resolution: number;
  heightScale: number;
  noiseScale: number;
  heightNoise: (x: number, y: number) => number;
  foodNoise: (x: number, y: number) => number;
  getBiomeAt: (x: number, z: number) => Biome;
  propSpawner: PropSpawner;
  chunkKey: string;
  material: THREE.Material;
  onFoodCollected: (chunkKey: string, foodIndex: number) => void;
  collectedFood: Set<string>;
}

const Chunk: React.FC<ChunkProps> = ({
  position,
  size,
  resolution,
  heightScale,
  noiseScale,
  heightNoise,
  foodNoise,
  getBiomeAt,
  propSpawner,
  chunkKey,
  material,
  onFoodCollected,
  collectedFood,
}) => {
  const [chunkX, _, chunkZ] = position;
  const [props, setProps] = useState<PropInstance[]>([]);
  const [foodItems, setFoodItems] = useState<{ position: [number, number, number] }[]>([]);
  const { scene } = useThree();

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
        const randomNoise = heightNoise(worldX * noiseScale * 0.5, worldZ * noiseScale * 0.5);
        const variation = (randomNoise * biome.roughness) * 0.8;
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
  }, [position, size, resolution, heightScale, noiseScale, heightNoise, getBiomeAt]);

  useEffect(() => {
    const generateProps = async () => {
      const chunkProps = await propSpawner.generatePropsForChunk(
        chunkX / size,
        chunkZ / size,
        size,
        getBiomeAt(chunkX, chunkZ),
        (x, z) => heightNoise(x * noiseScale, z * noiseScale) * heightScale
      );
      setProps(chunkProps);

      // Generate food items
      const newFoodItems: { id: string; position: [number, number, number] }[] = [];
      const foodDensity = 5; // Adjust this value to control the number of food items
      for (let i = 0; i < foodDensity; i++) {
        const x = Math.random() * size;
        const z = Math.random() * size;
        const worldX = position[0] + x;
        const worldZ = position[2] + z;
        const foodValue = foodNoise(worldX * noiseScale, worldZ * noiseScale);
        const foodId = `${chunkKey}-food-${i}`;
        
        if (foodValue > 0.6 && !collectedFood.has(foodId)) {
          const height = heightNoise(worldX * noiseScale, worldZ * noiseScale) * heightScale;
          newFoodItems.push({ 
            id: foodId, 
            position: [x, height + 0.5, z] 
          });
        }
      }
      setFoodItems(newFoodItems);
    };

    generateProps();

    // Cleanup function to remove food items when chunk is unmounted
    return () => {
      foodItems.forEach((_, index) => {
        const foodObject = scene.getObjectByName(`${chunkKey}-food-${index}`);
        if (foodObject) {
          scene.remove(foodObject);
        }
      });
    };
  }, [chunkX, chunkZ, size, getBiomeAt, heightNoise, foodNoise, noiseScale, heightScale, propSpawner, chunkKey, position, collectedFood, scene]);

  const groupedProps = useMemo(() => {
    return props.reduce((acc, prop) => {
      if (!acc[prop.type]) {
        acc[prop.type] = [];
      }
      acc[prop.type].push(prop);
      return acc;
    }, {} as Record<string, PropInstance[]>);
  }, [props]);

  return (
    <>
      <mesh geometry={geometry} material={material} position={position} />
      {Object.entries(groupedProps).map(([type, instances]) => (
        <Prop key={`${chunkKey}-${type}`} type={type} instances={instances} />
      ))}
      {foodItems.map((item, index) => (
        <Food 
          key={`${chunkKey}-food-${index}`}
          position={item.position}
          onCollect={() => onFoodCollected(chunkKey, index)}
          name={`${chunkKey}-food-${index}`}
        />
      ))}
    </>
  );
};

export default Chunk;