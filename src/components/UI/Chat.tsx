import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Chat.css';

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

const MAX_MESSAGES = 10;

const Chat: React.FC<ChatSystemProps> = ({ playerId, playerName, socket }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim() && socket) {
      socket.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        id: playerId,
        message: inputMessage
      }));
      setInputMessage('');
    }
    setIsInputActive(false);
  }, [inputMessage, socket, playerId]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isInputActive) {
      event.stopPropagation();
      if (event.key === 'Enter') {
        handleSendMessage();
      } else if (event.key === 'Escape') {
        setIsInputActive(false);
        setInputMessage('');
      }
    } else if (event.key === 'Enter') {
      setIsInputActive(true);
    }
  }, [isInputActive, handleSendMessage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isInputActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputActive]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_MESSAGE') {
          setMessages((prevMessages) => [
            {
              id: data.id,
              playerName: data.playerName,
              message: data.message
            },
            ...prevMessages,
          ].slice(0, MAX_MESSAGES));
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <strong>{msg.playerName}:</strong> {msg.message}
          </div>
        ))}
      </div>
      {isInputActive && (
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          className="chat-input"
          onKeyDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
};

export default Chat;