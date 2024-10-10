import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSphere } from '@react-three/cannon';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCameraControls } from './CameraControls';
import { ShaderMaterial } from 'three';
import { vertexShader, fragmentShader } from '../shaders/PlayerShader';

const CHARACTER_SPEED = 20;
const CHARACTER_RADIUS = 1;
const JUMP_FORCE = 4;

const Character: React.FC = () => {
    const [sphereRef, api] = useSphere(() => ({
        mass: 1,
        position: [0, 5, 0],
        args: [CHARACTER_RADIUS],
        fixedRotation: true,
        linearDamping: 0.9,
    }));
    const meshRef = useRef<THREE.Mesh>(null);
    const keys = useKeyboard();
    const velocity = useRef(new THREE.Vector3());
    const position = useRef(new THREE.Vector3());
    const { rotation, updateCamera, isLocked } = useCameraControls();

    // Create shader material
    const shaderMaterial = useMemo(() => {
        return new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x0055ff) }, // Adjust base color as needed
            },
            transparent: true,
        });
    }, []);

    useEffect(() => {
        api.velocity.subscribe((v) => velocity.current.set(v[0], v[1], v[2]));
        api.position.subscribe((p) => position.current.set(p[0], p[1], p[2]));
    }, [api.velocity, api.position]);

    useFrame((_, delta) => {
        if (!meshRef.current || !isLocked) return;

        const direction = new THREE.Vector3();

        const forward = new THREE.Vector3(-Math.sin(rotation.y), 0, -Math.cos(rotation.y));
        const right = new THREE.Vector3(Math.cos(rotation.y), 0, -Math.sin(rotation.y));

        if (keys.w) direction.add(forward);
        if (keys.s) direction.sub(forward);
        if (keys.a) direction.sub(right);
        if (keys.d) direction.add(right);

        direction.normalize().multiplyScalar(CHARACTER_SPEED);

        api.velocity.set(direction.x, velocity.current.y, direction.z);

        if (keys.space && Math.abs(velocity.current.y) < 0.05) {
            api.velocity.set(velocity.current.x, JUMP_FORCE, velocity.current.z);
        }

        updateCamera(position.current);

        // Update mesh position to match physics body
        if (meshRef.current) {
            meshRef.current.position.copy(position.current);
        }

        // Update shader time
        shaderMaterial.uniforms.time.value += delta;
    });

    return (
        <mesh ref={meshRef} castShadow>
            <sphereGeometry args={[CHARACTER_RADIUS, 32, 32]} />
            <primitive object={shaderMaterial} attach="material" />
            <primitive object={sphereRef} />
        </mesh>
    );
};

export default Character;