import React, { forwardRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface NameTagProps {
  name: string | null;
}

const NameTag = forwardRef<any, NameTagProps>(({ name }, ref) => {
  return (
    <Text
      ref={ref}
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
});

export default NameTag;