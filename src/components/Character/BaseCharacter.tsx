import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, RapierRigidBody, CollisionEnterPayload, CollisionExitPayload, interactionGroups } from '@react-three/rapier';
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
  skin: string;
  onCollisionEnter?: (event: CollisionEnterPayload) => void;
  onCollisionExit?: (event: CollisionExitPayload) => void;
}

const BaseCharacter: React.FC<BaseCharacterProps> = ({
  playerId,
  playerName,
  position = [0, 25, 0],
  rigidBodyRef,
  characterRadius,
  onCollisionEnter,
  onCollisionExit
}) => {
    const internalRigidBodyRef = useRef<RapierRigidBody>(null);
    const ref = rigidBodyRef || internalRigidBodyRef;
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

    const [characterPosition, setCharacterPosition] = useState(new THREE.Vector3(...position));

    useFrame((_, delta) => {
        if (!ref.current) return;
        const translation = ref.current.translation();
        const newPosition = new THREE.Vector3(translation.x, translation.y, translation.z);
        setCharacterPosition(newPosition);

        // Update shader time
        shaderMaterial.uniforms.time.value += delta;
    });

    return (
        <>
            <RigidBody
                collisionGroups={interactionGroups(1,2)}
                ref={ref}
                colliders="ball"
                gravityScale={5}
                position={position}
                linearDamping={0.95}
                angularDamping={0.95}
                onCollisionEnter={onCollisionEnter}
                onCollisionExit={onCollisionExit}
            >
                <mesh ref={meshRef} castShadow>
                    <sphereGeometry args={[characterRadius, 32, 32]} />
                    <primitive object={shaderMaterial} attach="material" />
                </mesh>
            </RigidBody>
            <NameTag name={playerName} position={characterPosition} />
        </>
    );
};

export default BaseCharacter;