import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import Terrain from './Terrain';
import Character from './Character';

const Scene: React.FC = () => {
  return (
    <Canvas camera={{ position: [0, 50, 50], fov: 75 }}>
      <Sky sunPosition={[100, 100, 20]} />
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
        shadow-camera-far={50} 
        shadow-camera-left={-10} 
        shadow-camera-right={10} 
        shadow-camera-top={10} 
        shadow-camera-bottom={-10}
      />
      <Physics 
        gravity={[0, -9.81, 0]}
      >
        <Terrain 
        worldSize={128}
        chunkSize={32}
        chunkResolution={64}
        heightScale={2}
        noiseScale={0.2}
        />
        <Character />
      </Physics>
    </Canvas>
  );
};

export default Scene;