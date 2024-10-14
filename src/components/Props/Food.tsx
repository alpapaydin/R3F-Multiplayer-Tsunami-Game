import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3, Object3D, Mesh } from 'three';

interface FoodProps {
  position: [number, number, number];
  onCollect: (foodValue: number) => void;
  name: string;
  foodValue?: number;
}

const ANIMATION_DURATION = 1; // Total animation duration in seconds

const Food: React.FC<FoodProps> = ({ position, onCollect, name, foodValue = 1 }) => {
  const { scene } = useThree();
  const foodRef = useRef<Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [playerObject, setPlayerObject] = useState<Object3D | null>(null);
  const [initialFoodPosition, setInitialFoodPosition] = useState<Vector3 | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (foodRef.current) {
      setInitialFoodPosition(foodRef.current.position.clone());
    }
  }, []);

  useFrame((state, delta) => {
    if (isCollected && foodRef.current && playerObject && initialFoodPosition) {
      const currentPlayerPosition = new Vector3();
      playerObject.getWorldPosition(currentPlayerPosition);
      
      // Convert player world position to food's local space
      const foodWorldMatrix = foodRef.current.matrixWorld;
      const foodWorldMatrixInverse = foodWorldMatrix.clone().invert();
      const playerPositionLocal = currentPlayerPosition.applyMatrix4(foodWorldMatrixInverse);

      // Update animation progress
      setAnimationProgress((prev) => Math.min(prev + delta / ANIMATION_DURATION, 1));

      if (animationProgress < 0.5) {
        // Calculate new position based on animation progress
        const newPosition = new Vector3().lerpVectors(
          initialFoodPosition,
          playerPositionLocal,
          animationProgress
        );
        foodRef.current.position.copy(newPosition);

        // Calculate scale based on animation progress (starting from 1, ending at 0)
        const newScale = 1 - animationProgress;
        foodRef.current.scale.multiplyScalar(0.90);
      } else {
        // Animation complete, remove the food
        onCollect(foodValue);
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      colliders="ball"
      name={name}
      onCollisionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name === 'player' && !isCollected) {
          setIsCollected(true);
          setPlayerObject(payload.other.rigidBodyObject as unknown as Object3D);
          
          // Disable physics for the food item
          if (rigidBodyRef.current) {
            rigidBodyRef.current.setEnabled(false);
          }
        }
      }}
    >
      <mesh ref={foodRef}>
        <sphereGeometry args={[1 * foodValue, 32, 32]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </RigidBody>
  );
};

export default Food;