import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, RapierRigidBody, CollisionEnterPayload, CollisionExitPayload, interactionGroups, BallCollider } from '@react-three/rapier';
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
  socket: WebSocket | null;
}

const BaseCharacter: React.FC<BaseCharacterProps> = ({
  playerId,
  playerName,
  position = [0, 25, 0],
  rigidBodyRef,
  characterRadius,
  score,
  skin,
  onCollisionEnter,
  onCollisionExit,
  socket
}) => {
  const internalRigidBodyRef = useRef<RapierRigidBody>(null);
  const ref = rigidBodyRef || internalRigidBodyRef;
  const meshRef = useRef<THREE.Mesh>(null);
  const nameTagRef = useRef<any>();
  const { camera } = useThree();
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
  const nameTagOffset = useMemo(() => new THREE.Vector3(0, 1.5, 0), []);
  const [messages, setMessages] = useState<{ text: string; timestamp: number }[]>([]);
  
  const currentRadius = characterRadius * Math.max(score, 1);

  const updatePosition = useCallback((delta: number) => {
    if (!ref.current) return;
    const translation = ref.current.translation();
    characterPosition.set(translation.x, translation.y, translation.z);
    shaderMaterial.uniforms.time.value += delta;

    if (nameTagRef.current) {
      nameTagRef.current.position.copy(translation).add(nameTagOffset);
      nameTagRef.current.quaternion.copy(camera.quaternion);
    }
  }, [ref, characterPosition, shaderMaterial.uniforms, nameTagOffset, camera]);

  useFrame((_, delta) => {
    updatePosition(delta);
  });

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_MESSAGE' && data.id === playerId) {
          setMessages(prev => [...prev, { text: data.message, timestamp: Date.now() }]);
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket, playerId]);

  return (
    <>
      <RigidBody
        name="player"
        collisionGroups={interactionGroups(1, 2)}
        ref={ref}
        gravityScale={5}
        position={characterPosition}
        linearDamping={0.15}
        angularDamping={0.15}
        onCollisionEnter={onCollisionEnter}
        onCollisionExit={onCollisionExit}
      >
        <BallCollider args={[currentRadius]} />
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[currentRadius, 32, 32]} />
          <primitive object={shaderMaterial} attach="material" />
        </mesh>
      </RigidBody>
      <NameTag ref={nameTagRef} name={playerName} messages={messages} playerScore={score} />
    </>
  );
};

export default BaseCharacter;