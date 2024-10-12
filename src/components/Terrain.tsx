import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { RigidBody, interactionGroups } from '@react-three/rapier';
import Chunk from './Chunk';
import { getBiome, Biome } from '../systems/biomes';
import { useFrame } from '@react-three/fiber';
import alea from 'alea';
import { PropSpawner } from '../systems/PropSpawner';
import createBlendedTerrainMaterial from '../shaders/TerrainShader'; // Import shader

interface TerrainProps {
  chunkSize: number;
  chunkResolution: number;
  heightScale: number;
  noiseScale: number;
  playerPosition: THREE.Vector3;
  renderDistance: number;
  mapSeed: number;
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
}) => {
  const [loadedChunks, setLoadedChunks] = useState<ChunkData[]>([]);
  const prng = useMemo(() => alea(mapSeed), [mapSeed]);
  const heightNoise = useRef(createNoise2D(prng));
  const temperatureNoise = useRef(createNoise2D(prng));
  const humidityNoise = useRef(createNoise2D(prng));
  const previousPlayerChunk = useRef<{ x: number; z: number } | null>(null);
  const propSpawner = useMemo(() => new PropSpawner(mapSeed), [mapSeed]);

  const heightTexture = useMemo(() => {
    const size = chunkResolution * chunkResolution;
    const data = new Float32Array(size);

    // Generate height data and convert it to texture
    for (let i = 0; i < size; i++) {
      const x = i % chunkResolution;
      const z = Math.floor(i / chunkResolution);
      const heightValue = heightNoise.current(x * noiseScale, z * noiseScale);
      data[i] = heightValue;
    }

    const heightTexture = new THREE.DataTexture(data, chunkResolution, chunkResolution, THREE.LuminanceFormat, THREE.FloatType);
    heightTexture.needsUpdate = true;
    return heightTexture;
  }, [chunkResolution, noiseScale, heightNoise]);

  const material = useMemo(() => {
    return createBlendedTerrainMaterial(heightTexture);
  }, [heightTexture]);
  
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

  const loadChunk = useCallback((chunkData: ChunkData) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setLoadedChunks(prevChunks => {
          if (!prevChunks.some(chunk => chunk.key === chunkData.key)) {
            //console.log(`Loaded chunk: ${chunkData.key}`);
            return [...prevChunks, chunkData];
          }
          return prevChunks;
        });
        resolve();
      }, 0);
    });
  }, []);

  const updateChunks = useCallback(async () => {
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

    // Unload chunks that are out of range
    setLoadedChunks(prevChunks => 
      prevChunks.filter(chunk => currentChunkKeys.has(chunk.key))
    );

    // Load new chunks
    for (const chunk of newChunks) {
      await loadChunk(chunk);
    }

  }, [playerPosition, chunkSize, renderDistance, getChunkKey, loadedChunks, generateChunkData, loadChunk]);

  useEffect(() => {
    updateChunks();
  }, [updateChunks]);

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
            getBiomeAt={getBiomeAt}
            propSpawner={propSpawner}
            chunkKey={chunk.key}
            material={material}
          />
        </RigidBody>
      ))}
    </>
  );
};

export default Terrain;
