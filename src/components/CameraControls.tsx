import { useEffect, useState, useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MOUSE_SENSITIVITY = 0.002;
const MAX_POLAR_ANGLE = Math.PI * 0.4;
const SMOOTHING_FACTOR = 0.1;
const BASE_CAMERA_OFFSET = new THREE.Vector3(0, 5, 10);

interface Rotation {
    x: number;
    y: number;
}

export const useCameraControls = () => {
    const { camera, gl } = useThree();
    const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0 });
    const [isLocked, setIsLocked] = useState(false);
    const targetPosition = useRef(new THREE.Vector3());
    const targetLookAt = useRef(new THREE.Vector3());
    const currentPosition = useRef(new THREE.Vector3());
    const currentLookAt = useRef(new THREE.Vector3());

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!isLocked) return;
        
        setRotation(prev => {
            const newX = prev.x - event.movementY * MOUSE_SENSITIVITY;
            const newY = prev.y - event.movementX * MOUSE_SENSITIVITY;
            const clampedX = Math.max(-MAX_POLAR_ANGLE, Math.min(MAX_POLAR_ANGLE, newX));
            return { x: clampedX, y: newY };
        });
    }, [isLocked]);

    const lockPointer = useCallback(() => {
        if (!isLocked) {
            gl.domElement.requestPointerLock();
        }
    }, [gl, isLocked]);

    const unlockPointer = useCallback(() => {
        if (document.pointerLockElement === gl.domElement) {
            document.exitPointerLock();
        }
    }, [gl]);

    useEffect(() => {
        const canvas = gl.domElement;

        const handleLockChange = () => {
            setIsLocked(document.pointerLockElement === canvas);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                unlockPointer();
            }
        };

        canvas.addEventListener('click', lockPointer);
        document.addEventListener('pointerlockchange', handleLockChange);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.removeEventListener('click', lockPointer);
            document.removeEventListener('pointerlockchange', handleLockChange);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [gl, handleMouseMove, lockPointer, unlockPointer]);

    const updateCamera = useCallback((characterPosition: THREE.Vector3, characterRadius: number) => {
        const sizeScale = Math.max(characterRadius, 1);
        const cameraOffset = BASE_CAMERA_OFFSET.clone().multiplyScalar(Math.sqrt(sizeScale));
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
        targetPosition.current.copy(characterPosition).add(cameraOffset);

        const forward = new THREE.Vector3(-Math.sin(rotation.y), 0, -Math.cos(rotation.y));
        targetLookAt.current.copy(characterPosition);
        targetLookAt.current.y += Math.sin(rotation.x) * 10 * Math.sqrt(sizeScale);
        targetLookAt.current.add(forward.multiplyScalar(Math.cos(rotation.x) * 10 * Math.sqrt(sizeScale)));
    }, [rotation]);

    useFrame(() => {
        currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);
        currentLookAt.current.lerp(targetLookAt.current, SMOOTHING_FACTOR);

        camera.position.copy(currentPosition.current);
        camera.lookAt(currentLookAt.current);
        camera.up.set(0, 1, 0);
    });

    return { rotation, updateCamera, isLocked };
};