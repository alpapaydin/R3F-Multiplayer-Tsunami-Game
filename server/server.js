    const express = require('express');
    const http = require('http');
    const WebSocket = require('ws');

    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    // Server state
    let players = {};
    const mapSeed = Math.floor(Math.random() * 100000);

    function broadcast(data, excludeWs) {
        wss.clients.forEach((client) => {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    wss.on('connection', (ws) => {
        const playerId = `player_${Date.now()}`;
        console.log(playerId, "connected");
        
        players[playerId] = {
            playerName: "",
            position: { x: 0, y: 50, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            score: 0,
            isSpawned: false,
            skin: ""
        };

        ws.send(JSON.stringify({ 
            type: 'REGISTER', 
            id: playerId, 
            mapSeed 
        }));

        // Send current game state to the new player
        ws.send(JSON.stringify({
            type: 'GAME_STATE',
            players: Object.fromEntries(
                Object.entries(players).filter(([, player]) => player.isSpawned)
            )
        }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch(data.type) {
            case 'POSITION_UPDATE':
                if (players[data.id]) {
                    console.log("POSITION UPDATE", Date.now())
                    players[data.id].position = data.position;
                    players[data.id].velocity = data.velocity;
                    broadcast({
                        type: 'UPDATE_POSITION',
                        id: data.id,
                        position: data.position
                    }, ws);
                }
                break;

            case 'PLAYER_SPAWN':
                if (players[data.id]) {
                    console.log(message)
                    players[data.id].playerName = data.name;
                    players[data.id].skin = data.skin;
                    players[data.id].isSpawned = true;
                    broadcast({
                        type: 'PLAYER_SPAWNED',
                        id: data.id,
                        name: data.name,
                        skin: data.skin,
                        position: players[data.id].position
                    });
                }
                break;

            case 'SCORE_UPDATE':
                if (players[data.id]) {
                    players[data.id].score = data.score;
                    broadcast({
                        type: 'UPDATE_SCORE',
                        id: data.id,
                        score: data.score,
                    }, ws);
                }
                break;
            default:
                break;
        }
    });

        ws.on('close', () => {
            delete players[playerId];
            broadcast({ type: 'PLAYER_DISCONNECT', id: playerId });
        });
    });

server.listen(8080, () => {
    console.log('WebSocket server running on port 8080');
});