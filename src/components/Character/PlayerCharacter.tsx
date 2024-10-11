// components/characters/PlayerCharacter.tsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vec3, useRapier } from '@react-three/rapier';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useCameraControls } from '../CameraControls';
import { RapierRigidBody } from '@react-three/rapier';
import BaseCharacter from './BaseCharacter';  // Import the BaseCharacter component

const JUMP_FORCE = 5;
const MAX_VELOCITY = 100;

interface PlayerCharacterProps {

  onPositionUpdate: (position: THREE.Vector3) => void;
  socket: WebSocket | null;
  playerId: string | null;
  playerName: string | null;
  characterRadius: number;
  score: number;
}

const PlayerCharacter: React.FC<PlayerCharacterProps> = ({ onPositionUpdate, socket, playerId, playerName, characterRadius, score }) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const keys = useKeyboard();
    const { rotation, updateCamera } = useCameraControls();
    const targetVelocity = useMemo(() => new THREE.Vector3(), []);
    const jumpDirection = useMemo(() => vec3({ x: 0, y: JUMP_FORCE, z: 0 }), []);
    const characterPosition = useMemo(() => new THREE.Vector3(), []);
    const { rapier, world } = useRapier();

    useFrame((_, delta) => {
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
            THREE.MathUtils.lerp(currentVelocity.x, targetVelocity.x, delta * 5),
            currentVelocity.y,
            THREE.MathUtils.lerp(currentVelocity.z, targetVelocity.z, delta * 5)
        );
        rigidBody.setLinvel(vec3(newVelocity), true);

        // Jumping logic
        if (keys.space) {
            const position = rigidBody.translation();
            const jumpRay = new rapier.Ray({ x: position.x, y: position.y, z: position.z }, { x: 0, y: -1, z: 0 });
            const hit = world.castRay(jumpRay, characterRadius + 0.1, true);
            if (hit) {
                rigidBody.applyImpulse(jumpDirection, true);
            }
        }

        // Update position and camera
        const translation = rigidBody.translation();
        characterPosition.set(translation.x, translation.y, translation.z);
        updateCamera(characterPosition);
        onPositionUpdate(characterPosition);

        // Send position update to server via WebSocket
        if (socket && playerId) {
            socket.send(JSON.stringify({
                type: 'POSITION_UPDATE',
                id: playerId,
                position: { x: characterPosition.x, y: characterPosition.y, z: characterPosition.z }
            }));
        }
    });

    return (
        <BaseCharacter
          score={score}
          characterRadius={characterRadius}
          rigidBodyRef={rigidBodyRef}
          playerId={playerId}
          playerName={playerName}
          position={[0, 20, 0]}
        />
    );
};

export default PlayerCharacter;
