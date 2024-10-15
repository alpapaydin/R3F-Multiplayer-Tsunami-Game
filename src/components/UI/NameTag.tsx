import React, { forwardRef, useState, useEffect } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NameTagProps {
  name: string | null;
  messages: { text: string; timestamp: number }[];
  playerScore: number;
}

interface VisibleMessage {
  text: string;
  timestamp: number;
  opacity: number;
  y: number;
}

const NameTag = forwardRef<THREE.Group, NameTagProps>(({ name, messages, playerScore }, ref) => {
  const [visibleMessages, setVisibleMessages] = useState<VisibleMessage[]>([]);

  useEffect(() => {
    if (messages.length > 0) {
      const newMessage = messages[messages.length - 1];
      setVisibleMessages(prev => [
        ...prev.map(msg => ({ ...msg, y: msg.y + 0.4 })),
        { ...newMessage, opacity: 1, y: 0 }
      ]);
    }
  }, [messages]);

  useFrame((_, delta) => {
    setVisibleMessages(prev =>
      prev.filter(msg => Date.now() - msg.timestamp < 2000)
         .map(msg => ({
           ...msg,
           opacity: Math.max(0, msg.opacity - delta / 2),
           y: msg.y + delta * 0.2
         }))
    );
  });

  return (
    <Billboard ref={ref}>
      <Text
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineColor="black"
        outlineWidth={0.05}
        position={[0, 0.3 + playerScore, 0]}
      >
        {name}
      </Text>
      {visibleMessages.map((msg) => (
        <Text
          key={msg.timestamp}
          fontSize={0.9}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineColor="black"
          outlineWidth={0.05}
          position={[0, 1 + msg.y + playerScore, 0]}
          maxWidth={7}
          overflowWrap="break-word"
          textAlign="center"
        >
          {msg.text}
        </Text>
      ))}
    </Billboard>
  );
});

export default NameTag;