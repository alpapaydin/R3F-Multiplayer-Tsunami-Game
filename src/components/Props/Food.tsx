import React from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';

interface FoodProps {
  position: [number, number, number];
  onCollect: () => void;
  name: string;
  foodValue?: number;
}

const Food: React.FC<FoodProps> = ({ position, onCollect, name, foodValue=1 }) => {
  const { scene } = useThree();

  return (
    <RigidBody
      type="dynamic"
      position={position}
      colliders="ball"
      name={name}
      onCollisionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === 'player') {
          onCollect();
          scene.remove(payload.target.rigidBodyObject!);
        }
      }}
    >
      <mesh>
        <sphereGeometry args={[1*foodValue, 32, 32]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </RigidBody>
  );
};

export default Food;