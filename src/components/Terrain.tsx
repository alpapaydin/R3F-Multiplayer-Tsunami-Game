import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { RigidBody } from '@react-three/rapier';

interface TerrainProps {
  worldSize: number;
  chunkSize: number;
  chunkResolution: number;
  heightScale: number;
  noiseScale: number;
}

const Terrain: React.FC<TerrainProps> = ({
  worldSize,
  chunkSize,
  chunkResolution,
  heightScale,
  noiseScale,
}) => {
  const noise2D = useMemo(() => createNoise2D(), []);

  const chunks = useMemo(() => {
    const chunksCount = Math.floor(worldSize / chunkSize);
    const chunkArray = [];

    for (let i = 0; i < chunksCount; i++) {
      for (let j = 0; j < chunksCount; j++) {
        const chunkX = i * chunkSize;
        const chunkZ = j * chunkSize;

        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        for (let x = 0; x <= chunkResolution; x++) {
          for (let z = 0; z <= chunkResolution; z++) {
            const xPos = chunkX + (x / chunkResolution) * chunkSize;
            const zPos = chunkZ + (z / chunkResolution) * chunkSize;
            const height = (noise2D(xPos * noiseScale, zPos * noiseScale) + 1) * 0.5 * heightScale;

            vertices.push(xPos, height, zPos);

            if (x < chunkResolution && z < chunkResolution) {
              const a = x * (chunkResolution + 1) + z;
              const b = x * (chunkResolution + 1) + z + 1;
              const c = (x + 1) * (chunkResolution + 1) + z;
              const d = (x + 1) * (chunkResolution + 1) + z + 1;
              indices.push(a, b, d, a, d, c);
            }
          }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        chunkArray.push(
          <RigidBody type="fixed" colliders="trimesh" key={`chunk-${i}-${j}`}>
            <mesh geometry={geometry}>
              <meshStandardMaterial color="green" />
            </mesh>
          </RigidBody>
        );
      }
    }

    return chunkArray;
  }, [worldSize, chunkSize, chunkResolution, heightScale, noiseScale, noise2D]);

  return <>{chunks}</>;
};

export default Terrain;