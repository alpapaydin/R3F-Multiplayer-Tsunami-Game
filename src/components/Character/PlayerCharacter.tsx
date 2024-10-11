import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vec3, useRapier, CollisionEnterPayload, CollisionExitPayload, interactionGroups } from '@react-three/rapier';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useCameraControls } from '../CameraControls';
import { RapierRigidBody } from '@react-three/rapier';
import BaseCharacter from './BaseCharacter';

const JUMP_FORCE = 100;
const MAX_VELOCITY = 20;

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
  onCollisionExit
}) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const keys = useKeyboard();
    const { rotation, updateCamera } = useCameraControls();
    const targetVelocity = useMemo(() => new THREE.Vector3(), []);
    const jumpDirection = useMemo(() => vec3({ x: 0, y: JUMP_FORCE, z: 0 }), []);
    const characterPosition = useMemo(() => new THREE.Vector3(), []);
    const characterVelocity = useMemo(() => new THREE.Vector3(), []);
    const { rapier, world } = useRapier();

    // State to track if the character is grounded
    const [isGrounded, setIsGrounded] = useState(false);

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

        // Grounded check using raycasting
        const position = rigidBody.translation();
        const jumpRay = new rapier.Ray({ x: position.x, y: position.y, z: position.z }, { x: 0, y: -1, z: 0 });
        const hit = world.castRay(jumpRay, characterRadius + 1.1, true, undefined, interactionGroups(1));
        setIsGrounded(!!hit); // Set isGrounded based on raycast hit
        // Jumping logic
        if (keys.space && isGrounded) {
            rigidBody.applyImpulse(jumpDirection, true);
            setIsGrounded(false); // Reset grounded status after jumping
        }

        // Update position and camera
        const translation = rigidBody.translation();
        characterPosition.set(translation.x, translation.y, translation.z);
        characterVelocity.set(newVelocity.x, newVelocity.y, newVelocity.z);
        updateCamera(characterPosition);
        
        // Call onPositionUpdate with both position and velocity
        onPositionUpdate(characterPosition, characterVelocity);
    });

    const handleCollisionEnter = (event: CollisionEnterPayload) => {
        //console.log("Collision Enter:", event);
        if (event.other.rigidBodyObject) {
            //console.log(`${event.target.rigidBodyObject} collided with ${event.other.rigidBodyObject}`);
        }
        onCollisionEnter?.(event);
    };

    const handleCollisionExit = (event: CollisionExitPayload) => {
        //console.log("Collision Exit:", event);
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
          position={[0, 20, 0]}
          onCollisionEnter={handleCollisionEnter}
          onCollisionExit={handleCollisionExit}
        />
    );
};

export default PlayerCharacter;
