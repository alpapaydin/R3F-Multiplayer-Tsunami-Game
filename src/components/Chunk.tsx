import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Biome } from '../systems/biomes';
import { PropSpawner, PropInstance } from '../systems/PropSpawner';
import Prop from './Props/Prop';
import Food from './Props/Food';
import {FOOD_DENSITY} from '../constants';

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
  onFoodCollected: (chunkKey: string, foodIndex: number, foodValue: number) => void;
  collectedFood: Set<string>;
  mapSeed: number;
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
  mapSeed,
}) => {
  const foodValue = Math.random() * (5 - 0.1) + 0.1;
  const [chunkX, _, chunkZ] = position;
  const [props, setProps] = useState<PropInstance[]>([]);
  const { scene } = useThree();
  const [foodItems, setFoodItems] = useState<{ id: string; position: [number, number, number] }[]>([]);
  const generateFoodItems = useMemo(() => {
    const chunkNoise = foodNoise;
    const newFoodItems: { id: string; position: [number, number, number] }[] = [];
    const foodDensity = FOOD_DENSITY; // Adjust this value to control the number of food items

    for (let i = 0; i < foodDensity; i++) {
      // Generate local coordinates within the chunk
      const localX = (chunkNoise(i * 0.1, 0) * 0.5 + 0.5) * size;
      const localZ = (chunkNoise(0, i * 0.1) * 0.5 + 0.5) * size;
      
      // Calculate world coordinates
      const worldX = chunkX + localX;
      const worldZ = chunkZ + localZ;
      
      const foodValue = foodNoise(worldX * noiseScale, worldZ * noiseScale);
      const foodId = `${chunkKey}/food/${i}`;
      
      if (foodValue > 0.6 && !collectedFood.has(foodId)) {
        const height = heightNoise(worldX * noiseScale, worldZ * noiseScale) * heightScale;
        newFoodItems.push({ 
          id: foodId, 
          position: [localX, height + 0.5, localZ] // Use local coordinates for position within the chunk
        });
      }
    }
    return newFoodItems;
  }, [position, chunkKey, size, noiseScale, heightScale, heightNoise, foodNoise, collectedFood, mapSeed]);

  useEffect(() => {
    setFoodItems(generateFoodItems);
  }, [generateFoodItems]);

  

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
    };

    generateProps();

    // Cleanup function to remove food items when chunk is unmounted
    return () => {
      foodItems.forEach((_, index) => {
        const foodObject = scene.getObjectByName(`${chunkKey}/food/${index}`);
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
          foodValue={foodValue}
          key={`${chunkKey}/food/${index}`}
          position={[
            position[0] + item.position[0],
            item.position[1],
            position[2] + item.position[2]
          ]}
          onCollect={() => onFoodCollected(chunkKey, index, foodValue)}
          name={`${chunkKey}/food/${index}`}
        />
      ))}
    </>
  );
};

export default Chunk;