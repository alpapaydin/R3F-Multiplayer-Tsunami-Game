import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, useRapier, RapierRigidBody, vec3, useAfterPhysicsStep } from '@react-three/rapier';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCameraControls } from './CameraControls';
import { ShaderMaterial } from 'three';
import { vertexShader, fragmentShader } from '../shaders/PlayerShader';

const CHARACTER_RADIUS = 1;
const JUMP_FORCE = 5;
const MAX_VELOCITY = 100;

interface CharacterProps {
  onPositionUpdate: (position: THREE.Vector3) => void;
  socket: WebSocket | null; // WebSocket for sending data to the server
  playerId: string | null;  // Player ID assigned by the server
}

const Character: React.FC<CharacterProps> = ({ onPositionUpdate, socket, playerId }) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const keys = useKeyboard();
    const { rotation, updateCamera, isLocked } = useCameraControls();
    const { rapier, world } = useRapier();

    const shaderMaterial = useMemo(() => new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0x0055ff) },
        },
        transparent: true,
    }), []);

    const jumpRay = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }), [rapier]);
    const jumpDirection = useMemo(() => vec3({ x: 0, y: JUMP_FORCE, z: 0 }), []);
    const characterPosition = useMemo(() => new THREE.Vector3(), []);
    const targetVelocity = useMemo(() => new THREE.Vector3(), []);

    useFrame((_, delta) => {
        if (!rigidBodyRef.current) return;
        const rigidBody = rigidBodyRef.current;

        // Calculate target velocity
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

        // Jumping
        if (keys.space) {
            const position = rigidBody.translation();
            jumpRay.origin.x = position.x;
            jumpRay.origin.y = position.y;
            jumpRay.origin.z = position.z;
            const hit = world.castRay(jumpRay, CHARACTER_RADIUS + 0.1, true);
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

        // Update shader time
        shaderMaterial.uniforms.time.value += delta;
    });

    return (
        <RigidBody
            ref={rigidBodyRef}
            colliders="ball"
            mass={1}
            position={[0, 5, 0]}
            linearDamping={0.95}
            angularDamping={0.95}
        >
            <mesh ref={meshRef} castShadow>
                <sphereGeometry args={[CHARACTER_RADIUS, 32, 32]} />
                <primitive object={shaderMaterial} attach="material" />
            </mesh>
        </RigidBody>
    );
};

export default Character;
