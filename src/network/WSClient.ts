import * as THREE from 'three';

class WSClient {
  private socket: WebSocket | null = null;
  private playerId: string | null = null;
  private eventHandlers: { [key: string]: (data: any) => void } = {};
  private pingStartTime: number = 0;

  constructor(socket: WebSocket | null, playerId: string | null) {
    this.socket = socket;
    this.playerId = playerId;

    if (this.socket) {
      this.socket.onmessage = this.handleMessage.bind(this);
    }
  }

  on(eventType: string, handler: (data: any) => void) {
    this.eventHandlers[eventType] = handler;
  }

  private handleMessage(message: MessageEvent) {
    const data = JSON.parse(message.data);
    const handler = this.eventHandlers[data.type];
    if (handler) {
      handler(data);
    }
  }

  sendPosition(position: THREE.Vector3, velocity: THREE.Vector3) {
    if (this.socket && this.playerId) {
      const message = JSON.stringify({
        type: 'POSITION_UPDATE',
        id: this.playerId,
        position: { x: position.x, y: position.y, z: position.z },
        velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      });
      this.socket.send(message);
    }
  }

  updateScore(score: number) {
    if (this.socket && this.playerId) {
      this.socket.send(JSON.stringify({
        type: 'SCORE_UPDATE',
        id: this.playerId,
        score,
      }));
    }
  }

  handlePositionUpdates(updateHandler: (id: string, position: THREE.Vector3, velocity?: THREE.Vector3) => void) {
    this.on('UPDATE_POSITION', (data) => {
      const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
      const velocity = data.velocity
        ? new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z)
        : undefined;
      updateHandler(data.id, position, velocity);
    });
  }

  handlePlayerDisconnects(disconnectHandler: (id: string) => void) {
    this.on('PLAYER_DISCONNECT', (data) => {
      disconnectHandler(data.id);
    });
  }

  handleGameState(stateHandler: (players: { [key: string]: { position: THREE.Vector3; velocity?: THREE.Vector3; name: string; score: number; skin: string } }) => void) {
    this.on('GAME_STATE', (data) => {
      const players: { [key: string]: { position: THREE.Vector3; velocity?: THREE.Vector3; name: string; score: number; skin: string } } = {};
      Object.keys(data.players).forEach((id) => {
        players[id] = {
          position: new THREE.Vector3(data.players[id].position.x, data.players[id].position.y, data.players[id].position.z),
          velocity: data.players[id].velocity
            ? new THREE.Vector3(data.players[id].velocity.x, data.players[id].velocity.y, data.players[id].velocity.z)
            : undefined,
          name: data.players[id].playerName,
          score: data.players[id].score,
          skin: data.players[id].skin
        };
      });
      stateHandler(players);
    });
  }

  handlePlayerSpawned(spawnHandler: (id: string, name: string, skin: string, position: { x: number, y: number, z: number }, velocity?: { x: number, y: number, z: number }) => void) {
    this.on('PLAYER_SPAWNED', (data) => {
      spawnHandler(data.id, data.name, data.skin, data.position, data.velocity);
    });
  }

  handleScoreUpdates(updateHandler: (id: string, score: number) => void) {
    this.on('UPDATE_SCORE', (data) => {
      updateHandler(data.id, data.score);
    });
  }

  handleLatencyUpdate(updateHandler: (latency: number) => void) {
    this.on('PONG', (data) => {
      const latency = Date.now() - this.pingStartTime;
      updateHandler(latency);
    });
  }

  measureLatency() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.playerId) {
      this.pingStartTime = Date.now();
      const message = JSON.stringify({
        type: 'PING',
        id: this.playerId
      });
      this.socket.send(message);
    } else {
      console.error('Cannot send PING: Socket not open or playerId not set');
    }
  }
}

export default WSClient;