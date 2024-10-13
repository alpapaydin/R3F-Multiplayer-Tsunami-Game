import React, { useState, useEffect, useCallback } from 'react';
import { useKeyboard } from '../../hooks/useKeyboard';

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
}

interface ChatSystemProps {
  playerId: string | null;
  playerName: string;
  socket: WebSocket | null;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ playerId, playerName, socket }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const keys = useKeyboard();

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim() && socket) {
      socket.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        id: playerId,
        message: inputMessage
      }));
      setInputMessage('');
      setIsInputActive(false);
    }
  }, [inputMessage, socket, playerId]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (isInputActive) {
          handleSendMessage();
        } else {
          setIsInputActive(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInputActive, handleSendMessage]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_MESSAGE') {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: data.id,
              playerName: data.playerName,
              message: data.message
            }
          ]);
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <div style={{ height: '200px', overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.playerName}:</strong> {msg.message}
          </div>
        ))}
      </div>
      {isInputActive && (
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{ width: '100%', padding: '5px' }}
          autoFocus
        />
      )}
    </div>
  );
};

export default ChatSystem;