import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { RigidBody, interactionGroups } from '@react-three/rapier';
import Chunk from './Chunk';
import { getBiome, Biome } from '../systems/biomes';
import { useFrame } from '@react-three/fiber';
import alea from 'alea';
import { PropSpawner } from '../systems/PropSpawner';
import createBlendedTerrainMaterial from '../shaders/TerrainShader';

interface TerrainProps {
  chunkSize: number;
  chunkResolution: number;
  heightScale: number;
  noiseScale: number;
  playerPosition: THREE.Vector3;
  renderDistance: number;
  mapSeed: number;
  onFoodCollected: (chunkKey: string, foodIndex: number, foodValue: number) => void;
  collectedFood: Set<string>;
}

interface ChunkData {
  key: string;
  position: [number, number, number];
}

const MemoizedChunk = React.memo(Chunk);

const Terrain: React.FC<TerrainProps> = ({
  chunkSize,
  chunkResolution,
  heightScale,
  noiseScale,
  playerPosition,
  renderDistance,
  mapSeed,
  onFoodCollected,
  collectedFood,
}) => {
  const [loadedChunks, setLoadedChunks] = useState<ChunkData[]>([]);
  const [localCollectedFood, setLocalCollectedFood] = useState<Set<string>>(new Set());
  const prng = useMemo(() => alea(mapSeed), [mapSeed]);
  const heightNoise = useRef(createNoise2D(prng));
  const temperatureNoise = useRef(createNoise2D(prng));
  const humidityNoise = useRef(createNoise2D(prng));
  const foodNoise = useRef(createNoise2D(prng));
  const previousPlayerChunk = useRef<{ x: number; z: number } | null>(null);
  const propSpawner = useMemo(() => new PropSpawner(mapSeed), [mapSeed]);

  const material = useMemo(() => {
    const heightTexture = new THREE.DataTexture(
      new Float32Array(chunkResolution * chunkResolution),
      chunkResolution,
      chunkResolution,
      THREE.RedFormat,
      THREE.FloatType
    );
    heightTexture.needsUpdate = true;
    return createBlendedTerrainMaterial(heightTexture);
  }, [chunkResolution]);
  
  const getChunkKey = useCallback((x: number, z: number): string => {
    return `${Math.floor(x / chunkSize)},${Math.floor(z / chunkSize)}`;
  }, [chunkSize]);

  const getBiomeAt = useCallback((x: number, z: number): Biome => {
    const temperature = (temperatureNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    const humidity = (humidityNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    return getBiome(temperature, humidity);
  }, []);

  const generateChunkData = useCallback((chunkX: number, chunkZ: number): ChunkData => {
    const key = getChunkKey(chunkX * chunkSize, chunkZ * chunkSize);
    const position: [number, number, number] = [chunkX * chunkSize, 0, chunkZ * chunkSize];
    return { key, position };
  }, [chunkSize, getChunkKey]);

  const updateChunks = useCallback(() => {
    const playerChunkX = Math.floor(playerPosition.x / chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / chunkSize);

    if (previousPlayerChunk.current?.x === playerChunkX && previousPlayerChunk.current?.z === playerChunkZ) {
      return;
    }

    previousPlayerChunk.current = { x: playerChunkX, z: playerChunkZ };

    const newChunks: ChunkData[] = [];
    const currentChunkKeys = new Set<string>();

    for (let x = -renderDistance; x <= renderDistance; x++) {
      for (let z = -renderDistance; z <= renderDistance; z++) {
        const chunkX = playerChunkX + x;
        const chunkZ = playerChunkZ + z;
        const key = getChunkKey(chunkX * chunkSize, chunkZ * chunkSize);
        currentChunkKeys.add(key);

        if (!loadedChunks.some(chunk => chunk.key === key)) {
          newChunks.push(generateChunkData(chunkX, chunkZ));
        }
      }
    }

    setLoadedChunks(prevChunks => [
      ...prevChunks.filter(chunk => currentChunkKeys.has(chunk.key)),
      ...newChunks
    ]);

  }, [playerPosition, chunkSize, renderDistance, getChunkKey, loadedChunks, generateChunkData]);

  const handleFoodCollected = useCallback((chunkKey: string, foodIndex: number, foodValue: number) => {
    const foodId = `${chunkKey}/food/${foodIndex}`;
    //setLocalCollectedFood(prev => new Set(prev).add(foodId));
    onFoodCollected(chunkKey, foodIndex, foodValue);
  }, [onFoodCollected]);

  useEffect(() => {
    setLocalCollectedFood(new Set(collectedFood));
  }, [collectedFood]);

  useFrame(() => {
    updateChunks();
  });

  return (
    <>
      {loadedChunks.map(chunk => (
        <RigidBody
          key={chunk.key}
          type="fixed"
          colliders="trimesh"
          collisionGroups={interactionGroups(2, 1)}
        >
          <MemoizedChunk
            key={chunk.key}
            position={chunk.position}
            size={chunkSize}
            resolution={chunkResolution}
            heightScale={heightScale}
            noiseScale={noiseScale}
            heightNoise={heightNoise.current}
            foodNoise={foodNoise.current}
            getBiomeAt={getBiomeAt}
            propSpawner={propSpawner}
            chunkKey={chunk.key}
            material={material}
            onFoodCollected={handleFoodCollected}
            collectedFood={localCollectedFood}
            mapSeed={mapSeed}
          />
        </RigidBody>
      ))}
    </>
  );
};

export default React.memo(Terrain);