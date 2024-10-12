// src/components/Props/Prop.tsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PropInstance } from '../../systems/PropSpawner';

interface PropProps {
  instances: PropInstance[];
  type: string;
}

const Prop: React.FC<PropProps> = ({ instances, type }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();

  const getPropGeometry = () => {
    switch (type) {
      case 'Tree':
        return new THREE.CylinderGeometry(0.2, 0.4, 2, 8);
      case 'Rock':
        return new THREE.DodecahedronGeometry(0.5, 0);
      case 'Bush':
        return new THREE.SphereGeometry(0.5, 8, 8);
      case 'Grass':
        return new THREE.ConeGeometry(0.2, 0.8, 8);
      case 'Pine':
        return new THREE.ConeGeometry(0.5, 2, 8);
      case 'Cactus':
        return new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
      case 'DesertRock':
        return new THREE.OctahedronGeometry(0.5, 0);
      default:
        console.warn(`Unknown prop type: ${type}`);
        return new THREE.BoxGeometry(0.5, 0.5, 0.5);
    }
  };

  const getPropMaterial = () => {
    switch (type) {
      case 'Tree':
      case 'Bush':
      case 'Pine':
        return new THREE.MeshStandardMaterial({ color: 0x228B22 });
      case 'Rock':
      case 'DesertRock':
        return new THREE.MeshStandardMaterial({ color: 0x808080 });
      case 'Grass':
        return new THREE.MeshStandardMaterial({ color: 0x7CFC00 });
      case 'Cactus':
        return new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
      default:
        return new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    }
  };

  useEffect(() => {
    if (meshRef.current) {
      instances.forEach((instance, index) => {
        tempObject.position.set(...instance.position);
        tempObject.scale.setScalar(instance.scale);
        tempObject.rotation.y = instance.rotation;
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(index, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, );

  return (
    <instancedMesh
      ref={meshRef}
      args={[getPropGeometry(), getPropMaterial(), instances.length]}
      castShadow
      receiveShadow
    />
  );
};

export default Prop;