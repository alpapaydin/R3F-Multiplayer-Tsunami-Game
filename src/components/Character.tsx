import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, useRapier, RapierRigidBody, vec3 } from '@react-three/rapier';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCameraControls } from './CameraControls';
import { ShaderMaterial } from 'three';
import { vertexShader, fragmentShader } from '../shaders/PlayerShader';

const CHARACTER_FORCE = 500;
const CHARACTER_RADIUS = 1;
const JUMP_FORCE = 5;
const MAX_VELOCITY = 10;

const Character: React.FC = () => {
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

    useFrame((_, delta) => {
        if (!isLocked || !rigidBodyRef.current) return;
        const rigidBody = rigidBodyRef.current;

        // Movement
        const impulse = { x: 0, y: 0, z: 0 };
        if (keys.w) impulse.z -= CHARACTER_FORCE * delta;
        if (keys.s) impulse.z += CHARACTER_FORCE * delta;
        if (keys.a) impulse.x -= CHARACTER_FORCE * delta;
        if (keys.d) impulse.x += CHARACTER_FORCE * delta;

        const rotatedImpulse = new THREE.Vector3(impulse.x, 0, impulse.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
        rigidBody.applyImpulse(vec3(rotatedImpulse), true);

        // Velocity limiting
        const velocity = rigidBody.linvel();
        const horizontalVelocity = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
        if (horizontalVelocity > MAX_VELOCITY) {
            const scale = MAX_VELOCITY / horizontalVelocity;
            rigidBody.setLinvel({ x: velocity.x * scale, y: velocity.y, z: velocity.z * scale }, true);
        }

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

        // Update camera
        const translation = rigidBody.translation();
        characterPosition.set(translation.x, translation.y, translation.z);
        updateCamera(characterPosition);

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