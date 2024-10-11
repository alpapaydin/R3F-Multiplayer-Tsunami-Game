// components/characters/BaseCharacter.tsx
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3, ShaderMaterial } from 'three';
import NameTag from '../UI/NameTag';
import { vertexShader, fragmentShader } from '../../shaders/PlayerShader';

interface BaseCharacterProps {
  playerId: string | null;
  playerName: string | null;
  position?: [number, number, number];
  rigidBodyRef?: React.RefObject<RapierRigidBody>;
  characterRadius: number;
  score: number;
}

const BaseCharacter: React.FC<BaseCharacterProps> = ({ playerId, playerName, position = [0, 25, 0], rigidBodyRef, characterRadius }) => {
    const internalRigidBodyRef = useRef<RapierRigidBody>(null);
    const ref = rigidBodyRef || internalRigidBodyRef;  // Choose the appropriate ref

    const meshRef = useRef<THREE.Mesh>(null);
    const shaderMaterial = useMemo(() => new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0x0055ff) },
      },
      transparent: true,
    }), []);

    const characterPosition = useMemo(() => new THREE.Vector3(), []);
    const [nameTagPosition, setNameTagPosition] = useState(new THREE.Vector3());

    useFrame((_, delta) => {
        if (!ref.current) return;
        const translation = ref.current.translation()
        characterPosition.set(translation.x, translation.y, translation.z);
        console.log(playerName)
        setNameTagPosition(new THREE.Vector3(translation.x, translation.y, translation.z));

        // Update shader time
        shaderMaterial.uniforms.time.value += delta;
    });

    return (
        <>
            <RigidBody
                ref={rigidBodyRef}
                colliders="ball"
                gravityScale={5}
                position={position}
                linearDamping={0.95}
                angularDamping={0.95}
            >
                <mesh ref={meshRef} castShadow>
                    <sphereGeometry args={[characterRadius, 32, 32]} />
                    <primitive object={shaderMaterial} attach="material" />
                </mesh>
            </RigidBody>
            <NameTag name={playerName} position={nameTagPosition} />
        </>
    );
};

export default BaseCharacter;
