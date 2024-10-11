import React, { useState, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { RigidBody, interactionGroups } from '@react-three/rapier';
import Chunk from './Chunk';
import { getBiome, Biome } from '../systems/biomes';
import { useFrame } from '@react-three/fiber';
import alea from 'alea';
import { PropSpawner, PropInstance } from '../systems/PropSpawner';
import Prop from './Props/Prop';

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
  props: PropInstance[];
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

  const heightNoise = useRef(createNoise2D(prng));
  const temperatureNoise = useRef(createNoise2D(prng));
  const humidityNoise = useRef(createNoise2D(prng));
  const previousPlayerChunk = useRef<{ x: number; z: number } | null>(null);
  const chunkLoadQueue = useRef<ChunkData[]>([]);
  const isLoading = useRef(false);
  const frameCount = useRef(0);

  const propSpawner = useMemo(() => new PropSpawner(mapSeed), [mapSeed]);

  const getChunkKey = useCallback((x: number, z: number): string => {
    return `${Math.floor(x / chunkSize)},${Math.floor(z / chunkSize)}`;
  }, [chunkSize]);

  const getBiomeAt = useCallback((x: number, z: number): Biome => {
    const temperature = (temperatureNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    const humidity = (humidityNoise.current(x * 0.001, z * 0.001) + 1) * 0.5;
    return getBiome(temperature, humidity);
  }, []);

  const getHeightAt = useCallback((x: number, z: number): number => {
    const biome = getBiomeAt(x, z);
    const heightValue = (heightNoise.current(x * noiseScale, z * noiseScale) + 1) * 0.5;
    return heightValue * heightScale * biome.heightMultiplier;
  }, [getBiomeAt, heightScale, noiseScale]);

  const generateChunkData = useCallback((chunkX: number, chunkZ: number): ChunkData => {
    const key = getChunkKey(chunkX * chunkSize, chunkZ * chunkSize);
    const position: [number, number, number] = [chunkX * chunkSize, 0, chunkZ * chunkSize];
    const biome = getBiomeAt(chunkX * chunkSize, chunkZ * chunkSize);
    const props = propSpawner.generatePropsForChunk(chunkX, chunkZ, chunkSize, biome, getHeightAt);

    return { key, position, props };
  }, [chunkSize, getChunkKey, getBiomeAt, propSpawner, getHeightAt]);

  const loadChunk = useCallback((chunkData: ChunkData) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setLoadedChunks(prevChunks => {
          if (!prevChunks.some(chunk => chunk.key === chunkData.key)) {
            return [...prevChunks, chunkData];
          }
          return prevChunks;
        });
        resolve();
      }, 10);
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
    const chunkKeys = new Set<string>(loadedChunks.map(chunk => chunk.key));

    for (let x = -renderDistance; x <= renderDistance; x++) {
      for (let z = -renderDistance; z <= renderDistance; z++) {
        const chunkX = playerChunkX + x;
        const chunkZ = playerChunkZ + z;
        const key = getChunkKey(chunkX * chunkSize, chunkZ * chunkSize);

        if (!chunkKeys.has(key)) {
          chunkKeys.add(key);
          newChunks.push(generateChunkData(chunkX, chunkZ));
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
  }, [playerPosition, chunkSize, renderDistance, getChunkKey, loadedChunks, generateChunkData]);

  useFrame(() => {
    frameCount.current += 1;

    if (frameCount.current % 10 === 0) {
      updateChunks();
    }

    processChunkQueue();
  });

  const groupPropsByType = (props: PropInstance[]): Record<string, PropInstance[]> => {
    return props.reduce((acc, prop) => {
      if (!acc[prop.type]) {
        acc[prop.type] = [];
      }
      acc[prop.type].push(prop);
      return acc;
    }, {} as Record<string, PropInstance[]>);
  };

  return (
    <>
      {loadedChunks.map(chunk => (
        <React.Fragment key={chunk.key}>
          <RigidBody
            type="fixed"
            colliders="trimesh"
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
          {Object.entries(groupPropsByType(chunk.props)).map(([type, instances]) => (
            <Prop key={`${chunk.key}-${type}`} type={type} instances={instances} />
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

export default Terrain;