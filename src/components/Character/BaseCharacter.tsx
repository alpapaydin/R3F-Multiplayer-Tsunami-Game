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

  const characterPosition = useRef(new THREE.Vector3(...position));
  const nameTagOffset = useMemo(() => new THREE.Vector3(0, 1.5, 0), []);
  const [messages, setMessages] = useState<{ text: string; timestamp: number }[]>([]);
  
  // Animation states
  const [animatedRadius, setAnimatedRadius] = useState(characterRadius);
  const [targetRadius, setTargetRadius] = useState(characterRadius);
  const startRadius = useRef(characterRadius);
  const animationStartTime = useRef(0);

  // Animation parameters
  const animationDuration = 1; // seconds
  const easingFunction = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad

  useEffect(() => {
    const newTargetRadius = characterRadius * Math.max(score, 1);
    if (newTargetRadius !== targetRadius) {
      setTargetRadius(newTargetRadius);
      startRadius.current = animatedRadius;
      animationStartTime.current = Date.now();
    }
  }, [score, characterRadius, targetRadius, animatedRadius]);

  const updatePosition = useCallback((delta: number) => {
    if (ref.current) {
      const translation = ref.current.translation();
      characterPosition.current.set(translation.x, translation.y, translation.z);
    }
    
    shaderMaterial.uniforms.time.value += delta;

    if (nameTagRef.current) {
      nameTagRef.current.position.copy(characterPosition.current).add(nameTagOffset);
      nameTagRef.current.quaternion.copy(camera.quaternion);
    }

    // Animate the radius
    const elapsedTime = (Date.now() - animationStartTime.current) / 1000;
    const progress = Math.min(elapsedTime / animationDuration, 1);
    const t = easingFunction(progress);
    const newRadius = startRadius.current + (targetRadius - startRadius.current) * t;
    setAnimatedRadius(newRadius);

  }, [ref, shaderMaterial.uniforms, nameTagOffset, camera, targetRadius, animationDuration]);

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
        position={characterPosition.current}
        linearDamping={0.15}
        angularDamping={0.15}
        onCollisionEnter={onCollisionEnter}
        onCollisionExit={onCollisionExit}
      >
        <BallCollider args={[animatedRadius]} />
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[animatedRadius, 32, 32]} />
          <primitive object={shaderMaterial} attach="material" />
        </mesh>
      </RigidBody>
      <NameTag ref={nameTagRef} name={playerName} messages={messages} playerScore={score} />
    </>
  );
};

export default BaseCharacter;