import { useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MOUSE_SENSITIVITY = 0.002;
const MAX_POLAR_ANGLE = Math.PI * 0.4;

interface Rotation {
    x: number;
    y: number;
}

export const useCameraControls = () => {
    const { camera, gl } = useThree();
    const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0 });
    const [isLocked, setIsLocked] = useState(false);

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

    const updateCamera = useCallback((characterPosition: THREE.Vector3) => {
        const cameraOffset = new THREE.Vector3(0, 5, 10);
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
        camera.position.copy(characterPosition).add(cameraOffset);

        const forward = new THREE.Vector3(-Math.sin(rotation.y), 0, -Math.cos(rotation.y));
        const lookAtPoint = new THREE.Vector3();
        lookAtPoint.copy(characterPosition);
        lookAtPoint.y += Math.sin(rotation.x) * 10;
        lookAtPoint.add(forward.multiplyScalar(Math.cos(rotation.x) * 10));

        camera.lookAt(lookAtPoint);
        camera.up.set(0, 1, 0);
    }, [camera, rotation]);

    return { rotation, updateCamera, isLocked };
};