const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
const mapSeed = 31; // Generate a random seed once for the map

// Handle player connections
wss.on('connection', (ws) => {
    const playerId = `player_${Date.now()}`;
    players[playerId] = {
        playerName: "",
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        score: 0,  // Initialize score
    };

    // Send initial data to the newly connected client, including the mapSeed and other players
    ws.send(JSON.stringify({ type: 'REGISTER', id: playerId, players, mapSeed }));

    // Handle messages from the client
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'POSITION_UPDATE') {
            // Update the player's position and velocity in the server state
            if (players[data.id]) {
                players[data.id].position = data.position;
                players[data.id].velocity = data.velocity;
            }

            // Broadcast updated position to all other clients
            broadcast({
                type: 'UPDATE_POSITION',
                id: data.id,
                position: data.position,
            }, ws);
        }

        // Handle name update
        if (data.type === 'NAME_UPDATE') {
            if (players[data.id]) {
                players[data.id].playerName = data.name;

                // Broadcast the new name to all other clients
                broadcast({
                    type: 'UPDATE_NAME',
                    id: data.id,
                    name: data.name,
                }, ws);
            }
        }

        // Handle score update
        if (data.type === 'SCORE_UPDATE') {
            if (players[data.id]) {
                players[data.id].score = data.score;

                // Broadcast the updated score to all clients
                broadcast({
                    type: 'UPDATE_SCORE',
                    id: data.id,
                    score: data.score,
                }, ws);
            }
        }
    });

    ws.on('close', () => {
        delete players[playerId];
        broadcast({ type: 'PLAYER_DISCONNECT', id: playerId });
    });
});

// Function to broadcast to all clients except the sender
const broadcast = (data, excludeWs) => {
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

server.listen(8080, () => {
    console.log('WebSocket server running on port 8080');
});
