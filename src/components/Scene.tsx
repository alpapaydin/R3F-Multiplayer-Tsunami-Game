import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import Terrain from './Terrain';
import PlayerCharacter from './Character/PlayerCharacter';
import BaseCharacter from './Character/BaseCharacter';
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_RES, HEIGHT_SCALE, NOISE_SCALE, RENDER_DISTANCE, ENABLE_DEBUG } from '../constants';
import WSClient from '../network/WSClient';
import Hud from './UI/Hud';
import DebugPanel from './UI/DebugPanel';
import Chat from './UI/Chat';

// Define constants for position update optimization
const POSITION_UPDATE_THRESHOLD = 0.05; // Minimum distance (in units) to trigger an update
const POSITION_UPDATE_INTERVAL = 100; // Minimum time (in ms) between updates
const INTERPOLATION_FACTOR = 0.4; // Adjust this value to change interpolation speed

interface SceneProps {
  playerName: string;
  playerSkin: string;
  socket: WebSocket | null;
  playerId: string | null;
  mapSeed: number | null;
  isPlayerSpawned: boolean;
  initialGameState: any;
}

interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  name: string;
  score: number;
  skin: string;
}

const OtherPlayers: React.FC<{ players: {[key: string]: PlayerState}, playerId: string | null, socket: WebSocket | null}> = ({ players, playerId, socket }) => {
  useFrame((_, delta) => {
    Object.entries(players).forEach(([id, player]) => {
      if (id !== playerId && player && player.position && player.targetPosition && player.velocity) {
        player.position.lerp(player.targetPosition, INTERPOLATION_FACTOR);
        player.position.add(player.velocity.clone().multiplyScalar(delta));
      }
    });
  });

  return (
    <>
      {Object.entries(players).map(([id, player]) => (
        id !== playerId && player && player.position && (
          <BaseCharacter
            key={id}
            characterRadius={1}
            playerName={player.name}
            playerId={id}
            position={player.position.toArray()}
            score={player.score}
            skin={player.skin}
            socket={socket}
          />
        )
      ))}
    </>
  );
};

const Scene: React.FC<SceneProps> = ({ socket, playerId, mapSeed, playerName, playerSkin, isPlayerSpawned, initialGameState }) => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 50, 0));
  const [playerVelocity, setPlayerVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const [otherPlayers, setOtherPlayers] = useState<{[key: string]: PlayerState}>({});
  const [wsClient, setWsClient] = useState<WSClient | null>(null);
  const [latency, setLatency] = useState(0);

  const lastUpdatePosition = useRef(new THREE.Vector3(0, 50, 0));
  const lastUpdateTime = useRef(0);

  const handlePositionUpdate = useCallback((newPosition: THREE.Vector3, newVelocity: THREE.Vector3) => {
    setPlayerPosition(newPosition.clone());
    setPlayerVelocity(newVelocity.clone());
    
    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastUpdateTime.current;
    const distanceMoved = newPosition.distanceTo(lastUpdatePosition.current);

    if (distanceMoved > POSITION_UPDATE_THRESHOLD && timeSinceLastUpdate > POSITION_UPDATE_INTERVAL) {
      wsClient?.sendPosition(newPosition, newVelocity);
      
      lastUpdatePosition.current.copy(newPosition);
      lastUpdateTime.current = currentTime;
    }
  }, [wsClient]);

  useEffect(() => {
    if (initialGameState) {
      const initialPlayers: {[key: string]: PlayerState} = {};
      Object.entries(initialGameState).forEach(([id, playerData]: [string, any]) => {
        if (id !== playerId) {
          initialPlayers[id] = {
            position: new THREE.Vector3(
              playerData.position?.x ?? 0,
              playerData.position?.y ?? 50,
              playerData.position?.z ?? 0
            ),
            velocity: new THREE.Vector3(
              playerData.velocity?.x ?? 0,
              playerData.velocity?.y ?? 0,
              playerData.velocity?.z ?? 0
            ),
            targetPosition: new THREE.Vector3(
              playerData.position?.x ?? 0,
              playerData.position?.y ?? 50,
              playerData.position?.z ?? 0
            ),
            name: playerData.playerName ?? "Unknown",
            score: playerData.score ?? 0,
            skin: playerData.skin ?? "default"
          };
        }
      });
      setOtherPlayers(initialPlayers);
    }
  }, [initialGameState, playerId]);

  useEffect(() => {
    if (socket && playerId && !wsClient) {
      const client = new WSClient(socket, playerId);
      setWsClient(client);

      client.handlePositionUpdates((id, position, velocity) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            targetPosition: position,
            velocity: velocity ?? new THREE.Vector3(0, 0, 0),
          },
        }));
      });

      client.handlePlayerDisconnects((id) => {
        setOtherPlayers((prevPlayers) => {
          const updatedPlayers = { ...prevPlayers };
          delete updatedPlayers[id];
          return updatedPlayers;
        });
      });

      client.handleGameState((players) => {
        const updatedPlayers: {[key: string]: PlayerState} = {};
        Object.entries(players).forEach(([id, player]) => {
          if (player && player.position) {
            updatedPlayers[id] = {
              ...player,
              targetPosition: player.position.clone(),
              velocity: player.velocity ?? new THREE.Vector3(0, 0, 0),
            };
          }
        });
        setOtherPlayers(updatedPlayers);
      });

      client.handlePlayerSpawned((id, name, skin, position, velocity) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            position: new THREE.Vector3(position.x, position.y, position.z),
            velocity: velocity 
              ? new THREE.Vector3(velocity.x, velocity.y, velocity.z)
              : new THREE.Vector3(0, 0, 0),
            targetPosition: new THREE.Vector3(position.x, position.y, position.z),
            name,
            skin,
            score: 0,
          },
        }));
      });

      client.handleScoreUpdates((id, score) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            score,
          },
        }));
      });

      if (ENABLE_DEBUG) {
        client.handleLatencyUpdate((newLatency) => {
          setLatency(newLatency);
        });
      }
    }
  }, [socket, playerId, wsClient]);
  
  useEffect(() => {
    if (ENABLE_DEBUG && wsClient) {
      const intervalId = setInterval(() => {
        wsClient.measureLatency();
      }, 1000); // Measure latency every 5 seconds

      return () => clearInterval(intervalId);
    }
  }, [wsClient]);
  
  const GlobalSky = () => {
    const { camera } = useThree();
    
    useFrame(() => {
      if (camera) {
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
      }
    });
  
    return (
      <Sky 
        distance={450000} 
        sunPosition={[100, 100, 20]} 
        inclination={0}
        azimuth={0.25}
      />
    );
  };

  return (
    <>
    <Canvas camera={{ position: [0, 50, 50], fov: 75 }}>
      <GlobalSky />
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1.5}
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
        shadow-camera-far={50} 
        shadow-camera-left={-10} 
        shadow-camera-right={10} 
        shadow-camera-top={10} 
        shadow-camera-bottom={-10}
      />
      <Physics gravity={[0, -9.81, 0]}>
        {mapSeed && (
          <Terrain 
            chunkSize={CHUNK_SIZE}
            chunkResolution={CHUNK_RES}
            heightScale={HEIGHT_SCALE}
            noiseScale={NOISE_SCALE}
            playerPosition={playerPosition}
            renderDistance={RENDER_DISTANCE}
            mapSeed={mapSeed}
          />
        )}

        {isPlayerSpawned && (
          <PlayerCharacter
            characterRadius={1}
            onPositionUpdate={handlePositionUpdate}
            socket={socket}
            playerId={playerId}
            playerName={playerName}
            skin={playerSkin}
            score={0}
          />
        )}
        
        <OtherPlayers socket={socket} players={otherPlayers} playerId={playerId} />
      </Physics>
    </Canvas>
    
    <Hud players={otherPlayers} currentPlayerId={playerId} />
    <Chat playerId={playerId} playerName={playerName} socket={socket} />
    {ENABLE_DEBUG && <DebugPanel latency={latency} position={playerPosition} />}
    </>
  );
};

export default Scene;