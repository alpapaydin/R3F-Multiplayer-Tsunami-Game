import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { RigidBody } from '@react-three/rapier';
import Chunk from './Chunk';
import { getBiome, interpolateBiomes, Biome } from '../systems/biomes';

interface TerrainProps {
  chunkSize: number;
  chunkResolution: number;
  heightScale: number;
  noiseScale: number;
  playerPosition: THREE.Vector3;
  renderDistance: number;
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
}) => {
  const [loadedChunks, setLoadedChunks] = useState<ChunkData[]>([]);
  const heightNoise = useRef(createNoise2D());
  const temperatureNoise = useRef(createNoise2D());
  const humidityNoise = useRef(createNoise2D());
  const previousPlayerChunk = useRef<{ x: number; z: number } | null>(null);

  const getChunkKey = useCallback((x: number, z: number): string => {
    return `${Math.floor(x / chunkSize)},${Math.floor(z / chunkSize)}`;
  }, [chunkSize]);

  const getBiomeAt = useCallback((x: number, z: number): Biome => {
    const temperature = (temperatureNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    const humidity = (humidityNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    return getBiome(temperature, humidity);
  }, []);

  const updateChunks = useCallback(() => {
    const playerChunkX = Math.floor(playerPosition.x / chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / chunkSize);

    if (previousPlayerChunk.current?.x === playerChunkX && previousPlayerChunk.current?.z === playerChunkZ) {
      return;
    }

    previousPlayerChunk.current = { x: playerChunkX, z: playerChunkZ };

    const newLoadedChunks: ChunkData[] = [];
    const chunkKeys = new Set<string>();

    for (let x = -renderDistance; x <= renderDistance; x++) {
      for (let z = -renderDistance; z <= renderDistance; z++) {
        const chunkX = playerChunkX + x;
        const chunkZ = playerChunkZ + z;
        const key = getChunkKey(chunkX * chunkSize, chunkZ * chunkSize);

        chunkKeys.add(key);
        newLoadedChunks.push({
          key,
          position: [chunkX * chunkSize, 0, chunkZ * chunkSize],
        });
      }
    }

    setLoadedChunks(prevChunks => 
      prevChunks.filter(chunk => chunkKeys.has(chunk.key))
        .concat(newLoadedChunks.filter(chunk => !prevChunks.some(prevChunk => prevChunk.key === chunk.key)))
    );

  }, [playerPosition, chunkSize, renderDistance, getChunkKey]);

  useEffect(() => {
    updateChunks();
  }, [updateChunks]);

  return (
    <>
      {loadedChunks.map(chunk => (
        <RigidBody type="fixed" colliders="trimesh" key={chunk.key}>
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