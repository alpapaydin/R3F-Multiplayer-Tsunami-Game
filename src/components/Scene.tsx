import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, Debug } from '@react-three/cannon';
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
        defaultContactMaterial={{
          friction: 0.1,
          restitution: 0.1,
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 3,
        }}
      >
        <Debug color="black" scale={1.0}>
          <Terrain size={100} divisions={128} height={5} />
          <Character />
        </Debug>
      </Physics>
    </Canvas>
  );
};

export default Scene;