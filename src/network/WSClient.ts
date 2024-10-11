// network/WSClient.ts
import * as THREE from 'three';

class WSClient {
  private socket: WebSocket | null = null;
  private playerId: string | null = null;
  private eventHandlers: { [key: string]: (data: any) => void } = {};

  constructor(socket: WebSocket | null, playerId: string | null) {
    this.socket = socket;
    this.playerId = playerId;

    if (this.socket) {
      this.socket.onmessage = this.handleMessage.bind(this);
    }
  }

  // Register a custom event handler for specific message types
  on(eventType: string, handler: (data: any) => void) {
    this.eventHandlers[eventType] = handler;
  }

  // Handle incoming WebSocket messages and trigger event handlers
  private handleMessage(message: MessageEvent) {
    const data = JSON.parse(message.data);
    const handler = this.eventHandlers[data.type];
    if (handler) {
      handler(data);
    }
  }

  // Send position update
  sendPosition(position: THREE.Vector3, velocity: THREE.Vector3) {
    if (this.socket && this.playerId) {
      this.socket.send(JSON.stringify({
        type: 'POSITION_UPDATE',
        id: this.playerId,
        position: { x: position.x, y: position.y, z: position.z },
        velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      }));
    }
  }

  // Send player name update
  updateName(playerName: string) {
    if (this.socket && this.playerId) {
      this.socket.send(JSON.stringify({
        type: 'NAME_UPDATE',
        id: this.playerId,
        name: playerName,
      }));
    }
  }

  // Send score update
  updateScore(score: number) {
    if (this.socket && this.playerId) {
      this.socket.send(JSON.stringify({
        type: 'SCORE_UPDATE',
        id: this.playerId,
        score,
      }));
    }
  }

  // Internal listener for handling position updates
  handlePositionUpdates(updateHandler: (id: string, position: THREE.Vector3) => void) {
    this.on('UPDATE_POSITION', (data) => {
      const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
      updateHandler(data.id, position);
    });
  }

  // Internal listener for handling player disconnects
  handlePlayerDisconnects(disconnectHandler: (id: string) => void) {
    this.on('PLAYER_DISCONNECT', (data) => {
      disconnectHandler(data.id);
    });
  }

  // Internal listener for registering players
  handleRegistration(registerHandler: (players: { [key: string]: { position: THREE.Vector3; name: string; score: number } }) => void) {
    this.on('REGISTER', (data) => {
      const players: { [key: string]: { position: THREE.Vector3; name: string; score: number } } = {};
      Object.keys(data.players).forEach((id) => {
        players[id] = {
          position: new THREE.Vector3(data.players[id].position.x, data.players[id].position.y, data.players[id].position.z),
          name: data.players[id].playerName,
          score: data.players[id].score
        };
      });
      registerHandler(players);
    });
  }

  // Internal listener for handling name updates
  handleNameUpdates(updateHandler: (id: string, name: string) => void) {
    this.on('UPDATE_NAME', (data) => {
      updateHandler(data.id, data.name);
    });
  }

  // Internal listener for handling score updates
  handleScoreUpdates(updateHandler: (id: string, score: number) => void) {
    this.on('UPDATE_SCORE', (data) => {
      updateHandler(data.id, data.score);
    });
  }
}

export default WSClient;
