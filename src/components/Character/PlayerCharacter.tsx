import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vec3, useRapier, CollisionEnterPayload, CollisionExitPayload, interactionGroups } from '@react-three/rapier';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useCameraControls } from '../CameraControls';
import { RapierRigidBody } from '@react-three/rapier';
import BaseCharacter from './BaseCharacter';
import { SCORE_EFFECT_MULTIPLIER } from '../../constants';

const BASE_MOVE_FORCE = 2000;
const BASE_JUMP_FORCE = 250;
const BASE_MAX_VELOCITY = 70;
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
    const { rapier, world } = useRapier();
    const [isGrounded, setIsGrounded] = useState(false);

    const sizeScale = Math.max(score * SCORE_EFFECT_MULTIPLIER, 1);
    const moveForce = BASE_MOVE_FORCE * Math.pow(sizeScale,2);
    const jumpForce = BASE_JUMP_FORCE * sizeScale;
    const maxVelocity = BASE_MAX_VELOCITY * sizeScale;

    const jumpDirection = useMemo(() => vec3({ x: 0, y: jumpForce, z: 0 }), [jumpForce]);

    const updatePhysics = useCallback((delta: number) => {
        if (!rigidBodyRef.current) return;
        const rigidBody = rigidBodyRef.current;

        // Calculate move direction based on keyboard input
        moveDirection.set(0, 0, 0);
        if (keys.w) moveDirection.z -= 1;
        if (keys.s) moveDirection.z += 1;
        if (keys.a) moveDirection.x -= 1;
        if (keys.d) moveDirection.x += 1;
        moveDirection.normalize().multiplyScalar(moveForce * delta);
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
        if (speed > maxVelocity) {
            const limitedVel = new THREE.Vector3(currentVel.x, 0, currentVel.z)
                .normalize()
                .multiplyScalar(maxVelocity);
            rigidBody.setLinvel(
                { x: limitedVel.x, y: currentVel.y, z: limitedVel.z },
                true
            );
        }

        // Grounded check using raycasting
        const position = rigidBody.translation();
        const jumpRay = new rapier.Ray(position, { x: 0, y: -sizeScale, z: 0 });
        const hit = world.castRay(jumpRay, characterRadius + 0.1, true, undefined, interactionGroups(1));
        setIsGrounded(!!hit);

        // Jumping logic
        if (keys.space && isGrounded) {
            rigidBody.applyImpulse(jumpDirection, true);
        }

        // Update position and camera
        const translation = rigidBody.translation();
        updateCamera(new THREE.Vector3(translation.x, translation.y, translation.z), characterRadius * sizeScale);
        
        // Call onPositionUpdate with both position and velocity
        onPositionUpdate(
            new THREE.Vector3(translation.x, translation.y, translation.z),
            new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z)
        );
    }, [keys, rotation.y, moveDirection, jumpDirection, isGrounded, onPositionUpdate, updateCamera, rapier, world, characterRadius, moveForce, maxVelocity, sizeScale]);

    useFrame((_, delta) => {
        updatePhysics(delta);
    });

    const handleCollisionEnter = useCallback((event: CollisionEnterPayload) => {
        if (event.other.rigidBodyObject) {
            //check if foodvalue < playerscore
            //multiply size and dependent positions by score
        }
        onCollisionEnter?.(event);
    }, [onCollisionEnter]);

    const handleCollisionExit = useCallback((event: CollisionExitPayload) => {
        onCollisionExit?.(event);
    }, [onCollisionExit]);

    return (
        <BaseCharacter
          skin={skin}
          score={sizeScale}
          characterRadius={characterRadius}
          rigidBodyRef={rigidBodyRef}
          playerId={playerId}
          playerName={playerName}
          onCollisionEnter={handleCollisionEnter}
          onCollisionExit={handleCollisionExit}
          position={initialPos}
          socket={socket}
        />
    );
};

export default PlayerCharacter;