import React, { useRef, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface NameTagProps {
  name: string | null;
  position: THREE.Vector3;
}

const NameTag: React.FC<NameTagProps> = ({ name, position }) => {
  const textRef = useRef<any>();
  const { camera } = useThree();

  useEffect(() => {
    if (textRef.current) {
      textRef.current.position.set(position.x, position.y + 1.5, position.z);
    }
  }, [position]);

  useFrame(() => {
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <Text
      ref={textRef}
      fontSize={0.9}
      color="white"
      anchorX="center"
      anchorY="middle"
      outlineColor="black"
      outlineWidth={0.07}
    >
      {name}
    </Text>
  );
};

export default NameTag;