import React, { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, MeshStandardMaterial } from 'three';
import { createNoise2D } from 'simplex-noise';

interface ChunkProps {
  position: [number, number, number];
  size: number;
  resolution: number;
  heightScale: number;
  noiseScale: number;
}

const Chunk: React.FC<ChunkProps> = ({ position, size, resolution, heightScale, noiseScale }) => {
  const noise2D = useMemo(() => createNoise2D(), []);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = (i / resolution) * size;
        const z = (j / resolution) * size;
        const worldX = position[0] + x;
        const worldZ = position[2] + z;
        
        const height = (noise2D(worldX * noiseScale, worldZ * noiseScale) + 1) * 0.5 * heightScale;
        
        vertices.push(x, height, z);
        uvs.push(i / resolution, j / resolution);

        if (i < resolution && j < resolution) {
          const a = i * (resolution + 1) + j;
          const b = i * (resolution + 1) + j + 1;
          const c = (i + 1) * (resolution + 1) + j;
          const d = (i + 1) * (resolution + 1) + j + 1;
          indices.push(a, b, d, a, d, c);
        }
      }
    }

    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [position, size, resolution, heightScale, noiseScale, noise2D]);

  const material = useMemo(() => new MeshStandardMaterial({ 
    color: 'green', 
    wireframe: false,
  }), []);

  return <mesh geometry={geometry} material={material} position={position} />;
};

export default Chunk;