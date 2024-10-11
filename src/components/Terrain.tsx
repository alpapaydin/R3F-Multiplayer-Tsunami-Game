import React, { useState, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { RigidBody, interactionGroups } from '@react-three/rapier';
import Chunk from './Chunk';
import { getBiome, Biome } from '../systems/biomes';
import { useFrame } from '@react-three/fiber';
import alea from 'alea';

interface TerrainProps {
  chunkSize: number;
  chunkResolution: number;
  heightScale: number;
  noiseScale: number;
  playerPosition: THREE.Vector3;
  renderDistance: number;
  mapSeed: number; // New prop for map seed
}

interface ChunkData {
  key: string;
  position: [number, number, number];
}

const Terrain: React.FC<TerrainProps> = ({
  chunkSize,
  chunkResolution,
  heightScale,
  noiseScale,
  playerPosition,
  renderDistance,
  mapSeed,
}) => {
  const [loadedChunks, setLoadedChunks] = useState<ChunkData[]>([]);
  const prng = useMemo(() => alea(mapSeed), [mapSeed]);

  // Create noise functions using the seeded PRNG
  const heightNoise = useRef(createNoise2D(prng));       // Terrain height noise
  const temperatureNoise = useRef(createNoise2D(prng));  // Temperature noise
  const humidityNoise = useRef(createNoise2D(prng));     // Humidity noise
  const previousPlayerChunk = useRef<{ x: number; z: number } | null>(null);
  const chunkLoadQueue = useRef<ChunkData[]>([]);
  const isLoading = useRef(false);
  const frameCount = useRef(0);

  const getChunkKey = useCallback((x: number, z: number): string => {
    return `${Math.floor(x / chunkSize)},${Math.floor(z / chunkSize)}`;
  }, [chunkSize]);

  const getBiomeAt = useCallback((x: number, z: number): Biome => {
    const temperature = (temperatureNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    const humidity = (humidityNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    return getBiome(temperature, humidity);
  }, []);

  const loadChunk = useCallback((chunkData: ChunkData) => {
    return new Promise<void>((resolve) => {
      // Simulate chunk generation/loading time
      setTimeout(() => {
        setLoadedChunks(prevChunks => {
          // Prevent duplicate chunks with the same key
          if (!prevChunks.some(chunk => chunk.key === chunkData.key)) {
            return [...prevChunks, chunkData];
          }
          return prevChunks;
        });
        resolve();
      }, 10); // Adjust this value to simulate different load times
    });
  }, []);

  const processChunkQueue = useCallback(async () => {
    if (isLoading.current || chunkLoadQueue.current.length === 0) return;

    isLoading.current = true;
    const chunkToLoad = chunkLoadQueue.current.shift();
    if (chunkToLoad) {
      await loadChunk(chunkToLoad);
    }
    isLoading.current = false;
  }, [loadChunk]);

  const updateChunks = useCallback(() => {
    const playerChunkX = Math.floor(playerPosition.x / chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / chunkSize);

    if (previousPlayerChunk.current?.x === playerChunkX && previousPlayerChunk.current?.z === playerChunkZ) {
      return;
    }

    previousPlayerChunk.current = { x: playerChunkX, z: playerChunkZ };

    const newChunks: ChunkData[] = [];
    const chunkKeys = new Set<string>(loadedChunks.map(chunk => chunk.key)); // Use loadedChunks for existing keys

    for (let x = -renderDistance; x <= renderDistance; x++) {
      for (let z = -renderDistance; z <= renderDistance; z++) {
        const chunkX = playerChunkX + x;
        const chunkZ = playerChunkZ + z;
        const key = getChunkKey(chunkX * chunkSize, chunkZ * chunkSize);

        // Only add chunks that are not already loaded
        if (!chunkKeys.has(key)) {
          chunkKeys.add(key);
          newChunks.push({
            key,
            position: [chunkX * chunkSize, 0, chunkZ * chunkSize],
          });
        }
      }
    }

    setLoadedChunks(prevChunks => {
      const keptChunks = prevChunks.filter(chunk => {
        const [chunkX, chunkZ] = chunk.key.split(',').map(Number);
        const withinRenderDistance = Math.abs(chunkX - playerChunkX) <= renderDistance && Math.abs(chunkZ - playerChunkZ) <= renderDistance;
        return withinRenderDistance;
      });

      const chunksToAdd = newChunks.filter(chunk => !prevChunks.some(prevChunk => prevChunk.key === chunk.key));
      chunkLoadQueue.current.push(...chunksToAdd);
      return keptChunks;
    });
  }, [playerPosition, chunkSize, renderDistance, getChunkKey, loadedChunks]);

  useFrame(() => {
    frameCount.current += 1;

    // Only check for updates every 10 frames
    if (frameCount.current % 10 === 0) {
      updateChunks();
    }

    // Process chunk queue every frame
    processChunkQueue();
  });

  return (
    <>
      {loadedChunks.map(chunk => (
        <RigidBody
          type="fixed"
          colliders="trimesh"
          key={chunk.key}
          collisionGroups={interactionGroups(2, 1)}
          >
          <Chunk
            position={chunk.position}
            size={chunkSize}
            resolution={chunkResolution}
            heightScale={heightScale}
            noiseScale={noiseScale}
            heightNoise={heightNoise.current}
            getBiomeAt={getBiomeAt}
          />
        </RigidBody>
      ))}
    </>
  );
};

export default Terrain;
