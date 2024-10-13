import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vec3, useRapier, CollisionEnterPayload, CollisionExitPayload, interactionGroups } from '@react-three/rapier';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useCameraControls } from '../CameraControls';
import { RapierRigidBody } from '@react-three/rapier';
import BaseCharacter from './BaseCharacter';

const MOVE_FORCE = 500;
const JUMP_FORCE = 250;
const MAX_VELOCITY = 70;
const DAMPING = 0.95;

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
  initialPos = [0,25,0],
}) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const keys = useKeyboard();
    const { rotation, updateCamera } = useCameraControls();
    const moveDirection = useMemo(() => new THREE.Vector3(), []);
    const jumpDirection = useMemo(() => vec3({ x: 0, y: JUMP_FORCE, z: 0 }), []);
    const { rapier, world } = useRapier();
    const [isGrounded, setIsGrounded] = useState(false);

    const updatePhysics = useCallback((delta: number) => {
        if (!rigidBodyRef.current) return;
        const rigidBody = rigidBodyRef.current;

        // Calculate move direction based on keyboard input
        moveDirection.set(0, 0, 0);
        if (keys.w) moveDirection.z -= 1;
        if (keys.s) moveDirection.z += 1;
        if (keys.a) moveDirection.x -= 1;
        if (keys.d) moveDirection.x += 1;
        moveDirection.normalize().multiplyScalar(MOVE_FORCE * delta);
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);

        // Apply move force
        rigidBody.applyImpulse(vec3(moveDirection), true);

        // Apply damping
        const currentVel = rigidBody.linvel();
        rigidBody.setLinvel(
            { x: currentVel.x * DAMPING, y: currentVel.y, z: currentVel.z * DAMPING },
            true
        );

        // Limit max velocity
        const speed = new THREE.Vector3(currentVel.x, 0, currentVel.z).length();
        if (speed > MAX_VELOCITY) {
            const limitedVel = new THREE.Vector3(currentVel.x, 0, currentVel.z)
                .normalize()
                .multiplyScalar(MAX_VELOCITY);
            rigidBody.setLinvel(
                { x: limitedVel.x, y: currentVel.y, z: limitedVel.z },
                true
            );
        }

        // Grounded check using raycasting
        const position = rigidBody.translation();
        const jumpRay = new rapier.Ray(position, { x: 0, y: -1, z: 0 });
        const hit = world.castRay(jumpRay, characterRadius + 0.1, true, undefined, interactionGroups(1));
        setIsGrounded(!!hit);

        // Jumping logic
        if (keys.space && isGrounded) {
            rigidBody.applyImpulse(jumpDirection, true);
        }

        // Update position and camera
        const translation = rigidBody.translation();
        updateCamera(new THREE.Vector3(translation.x, translation.y, translation.z));
        
        // Call onPositionUpdate with both position and velocity
        onPositionUpdate(
            new THREE.Vector3(translation.x, translation.y, translation.z),
            new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z)
        );
    }, [keys, rotation.y, moveDirection, jumpDirection, isGrounded, onPositionUpdate, updateCamera, rapier, world, characterRadius]);

    useFrame((_, delta) => {
        updatePhysics(delta);
    });

    const handleCollisionEnter = useCallback((event: CollisionEnterPayload) => {
        onCollisionEnter?.(event);
    }, [onCollisionEnter]);

    const handleCollisionExit = useCallback((event: CollisionExitPayload) => {
        onCollisionExit?.(event);
    }, [onCollisionExit]);

    return (
        <BaseCharacter
          skin={skin}
          score={score}
          characterRadius={characterRadius}
          rigidBodyRef={rigidBodyRef}
          playerId={playerId}
          playerName={playerName}
          onCollisionEnter={handleCollisionEnter}
          onCollisionExit={handleCollisionExit}
          position={initialPos}
        />
    );
};

export default PlayerCharacter;