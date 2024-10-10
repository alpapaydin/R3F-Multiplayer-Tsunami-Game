import { useState, useEffect } from 'react';

interface KeyState {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    space: boolean;
}

export const useKeyboard = (): KeyState => {
    const [keys, setKeys] = useState<KeyState>({
        w: false,
        a: false,
        s: false,
        d: false,
        space: false
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', ' '].includes(e.key)) {
                setKeys((prev) => ({ ...prev, [e.key === ' ' ? 'space' : e.key]: true }));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', ' '].includes(e.key)) {
                setKeys((prev) => ({ ...prev, [e.key === ' ' ? 'space' : e.key]: false }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return keys;
};