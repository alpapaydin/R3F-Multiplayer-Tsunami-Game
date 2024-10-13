import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, RapierRigidBody, CollisionEnterPayload, CollisionExitPayload, interactionGroups } from '@react-three/rapier';
import NameTag from '../UI/NameTag';
import { skins } from './skins';

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
  skin,
  onCollisionEnter,
  onCollisionExit
}) => {
  const internalRigidBodyRef = useRef<RapierRigidBody>(null);
  const ref = rigidBodyRef || internalRigidBodyRef;
  const meshRef = useRef<THREE.Mesh>(null);

  const { shader, uniforms } = useMemo(() => skins[skin] || skins.default, [skin]);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
        uniforms: uniforms,
        transparent: true,
      }),
    [shader, uniforms]
  );

  const characterPosition = useMemo(() => new THREE.Vector3(...position), [position]);

  const updatePosition = useCallback((delta: number) => {
    if (!ref.current) return;
    const translation = ref.current.translation();
    characterPosition.set(translation.x, translation.y, translation.z);
    shaderMaterial.uniforms.time.value += delta;
  }, [ref, characterPosition, shaderMaterial.uniforms]);

  useFrame((_, delta) => {
    updatePosition(delta);
  });

  return (
    <>
      <RigidBody
        collisionGroups={interactionGroups(1, 2)}
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