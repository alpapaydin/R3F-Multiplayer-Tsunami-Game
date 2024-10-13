import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vec3, useRapier, CollisionEnterPayload, CollisionExitPayload, interactionGroups } from '@react-three/rapier';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useCameraControls } from '../CameraControls';
import { RapierRigidBody } from '@react-three/rapier';
import BaseCharacter from './BaseCharacter';

const JUMP_FORCE = 100;
const MAX_VELOCITY = 70;
const FIXED_TIMESTEP = 1 / 60; // 60 Hz physics update
const MAX_DELTA_TIME = 0.1; // Maximum allowed delta time

interface PlayerCharacterProps {
  onPositionUpdate: (position: THREE.Vector3, velocity: THREE.Vector3) => void;
  socket: WebSocket | null;
  playerId: string | null;
  playerName: string | null;
  characterRadius: number;
  score: number;
  skin: string;
  onCollisionEnter?: (event: CollisionEnterPayload) => void;
  onCollisionExit?: (event: CollisionExitPayload) => void;
  initialPos?: [number,number,number];
}

const PlayerCharacter: React.FC<PlayerCharacterProps> = ({
  onPositionUpdate,
  socket,
  playerId,
  playerName,
  characterRadius,
  score,
  skin,
  onCollisionEnter,
  onCollisionExit,
  initialPos = [0,25,0]
}) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const keys = useKeyboard();
    const { rotation, updateCamera } = useCameraControls();
    const targetVelocity = useMemo(() => new THREE.Vector3(), []);
    const jumpDirection = useMemo(() => vec3({ x: 0, y: JUMP_FORCE, z: 0 }), []);
    const characterPosition = useMemo(() => new THREE.Vector3(...initialPos), []);
    const characterVelocity = useMemo(() => new THREE.Vector3(), []);
    const { rapier, world } = useRapier();
    const [isGrounded, setIsGrounded] = useState(false);
    const lastUpdateTime = useRef(0);
    const accumulatedTime = useRef(0);

    const updatePhysics = useCallback((deltaTime: number) => {
        if (!rigidBodyRef.current) return;
        const rigidBody = rigidBodyRef.current;

        // Calculate target velocity based on keyboard input
        targetVelocity.set(0, 0, 0);
        if (keys.w) targetVelocity.z -= 1;
        if (keys.s) targetVelocity.z += 1;
        if (keys.a) targetVelocity.x -= 1;
        if (keys.d) targetVelocity.x += 1;
        targetVelocity.normalize().multiplyScalar(MAX_VELOCITY);
        targetVelocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);

        // Smoothly interpolate current velocity to target velocity
        const currentVelocity = rigidBody.linvel();
        const newVelocity = new THREE.Vector3(
            THREE.MathUtils.lerp(currentVelocity.x, targetVelocity.x, deltaTime * 5),
            currentVelocity.y,
            THREE.MathUtils.lerp(currentVelocity.z, targetVelocity.z, deltaTime * 5)
        );
        rigidBody.setLinvel(vec3(newVelocity), true);

        // Grounded check using raycasting
        const position = rigidBody.translation();
        const jumpRay = new rapier.Ray({ x: position.x, y: position.y, z: position.z }, { x: 0, y: -1, z: 0 });
        const hit = world.castRay(jumpRay, characterRadius + 1.1, true, undefined, interactionGroups(1));
        setIsGrounded(!!hit);

        // Jumping logic
        if (keys.space && isGrounded) {
            rigidBody.applyImpulse(jumpDirection, true);
            setIsGrounded(false);
        }

        // Update position and camera
        const translation = rigidBody.translation();
        characterPosition.set(translation.x, translation.y, translation.z);
        characterVelocity.set(newVelocity.x, newVelocity.y, newVelocity.z);
        updateCamera(characterPosition);
        
        // Call onPositionUpdate with both position and velocity
        onPositionUpdate(characterPosition, characterVelocity);
    }, [keys, rotation.y, targetVelocity, jumpDirection, characterPosition, characterVelocity, isGrounded, onPositionUpdate, updateCamera, rapier, world, characterRadius]);

    useFrame((state) => {
        const currentTime = state.clock.getElapsedTime();
        let deltaTime = currentTime - lastUpdateTime.current;
        deltaTime = Math.min(deltaTime, MAX_DELTA_TIME); // Limit maximum delta time
        
        accumulatedTime.current += deltaTime;
        
        while (accumulatedTime.current >= FIXED_TIMESTEP) {
            updatePhysics(FIXED_TIMESTEP);
            accumulatedTime.current -= FIXED_TIMESTEP;
        }
        
        lastUpdateTime.current = currentTime;
    });

    const handleCollisionEnter = (event: CollisionEnterPayload) => {
        onCollisionEnter?.(event);
    };

    const handleCollisionExit = (event: CollisionExitPayload) => {
        onCollisionExit?.(event);
    };

    return (
        <BaseCharacter
          skin={skin}
          score={score}
          characterRadius={characterRadius}
          rigidBodyRef={rigidBodyRef}
          playerId={playerId}
          playerName={playerName}
          position={characterPosition.toArray()}
          onCollisionEnter={handleCollisionEnter}
          onCollisionExit={handleCollisionExit}
        />
    );
};

export default PlayerCharacter;