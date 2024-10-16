const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();

// Read SSL certificate files
const privateKey = fs.readFileSync(path.join(__dirname, '../.cert', 'privkey4.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, '../.cert', 'fullchain4.pem'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

// Create HTTPS server
const server = https.createServer(credentials, app);

// Create secure WebSocket server
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
            case 'CHAT_MESSAGE':
                if (players[data.id]) {
                    broadcast({
                        type: 'CHAT_MESSAGE',
                        id: data.id,
                        playerName: players[data.id].playerName,
                        message: data.message
                    });
                }
                break;
            case 'PING':
                ws.send(JSON.stringify({
                    type: 'PONG'
                }));
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

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Secure WebSocket server running on port ${PORT}`);
});