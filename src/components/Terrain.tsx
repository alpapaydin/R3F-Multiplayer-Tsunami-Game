import React, { useMemo } from 'react';
import { useHeightfield } from '@react-three/cannon';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { createNoise2D } from 'simplex-noise';
import { Group } from 'three';

const noise2D = createNoise2D();

const Terrain: React.FC<{ size?: number; divisions?: number; height?: number }> = ({ 
  size = 100, 
  divisions = 128, 
  height = 5 
}) => {
  const heights = useMemo(() => {
    const data: number[][] = [];
    for (let i = 0; i < divisions; i++) {
      const row: number[] = [];
      for (let j = 0; j < divisions; j++) {
        const x = (i / divisions) * size;
        const y = (j / divisions) * size;
        row.push((noise2D(x * 0.02, y * 0.02) + 1) * 0.5 * height);
      }
      data.push(row);
    }
    return data;
  }, [size, divisions, height]);

  const [ref] = useHeightfield(() => ({
    args: [
      heights,
      {
        elementSize: size / divisions,
      },
    ],
    position: [size / 2, 0, -size / 2],
    rotation: [-Math.PI / 2, 0, -Math.PI],
    material: {
      friction: 0.5,
      restitution: 0.1,
    },
  }), undefined, [heights, size, divisions, height]);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        const x = (i / (divisions - 1)) * size - size / 2;
        const z = (j / (divisions - 1)) * size - size / 2;
        const y = heights[i][j];
        vertices.push(x, y, z);

        if (i < divisions - 1 && j < divisions - 1) {
          const a = i * divisions + j;
          const b = i * divisions + j + 1;
          const c = (i + 1) * divisions + j;
          const d = (i + 1) * divisions + j + 1;
          indices.push(a, b, d);
          indices.push(a, d, c);
        }
      }
    }

    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [heights, size, divisions, height]);

  return (
    <>
      {/* Invisible collision mesh */}
      <group ref={ref as React.RefObject<Group>} />
      
      {/* Visible terrain mesh */}
      <mesh receiveShadow>
        <primitive object={geometry} />
        <meshStandardMaterial color="green" wireframe />
      </mesh>
    </>
  );
};

export default Terrain;