const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Server state
let players = {};
const mapSeed = Math.floor(Math.random() * 100000); // Generate a random seed once for the map

// Function to broadcast data to all clients except the sender
function broadcast(data, excludeWs) {
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Handle player connections
wss.on('connection', (ws) => {
    // Generate a unique ID for the player
    const playerId = `player_${Date.now()}`;
    
    // Initialize the player with default values
    players[playerId] = {
        playerName: "",
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        score: 0,  // Initialize score
    };

    // Send the map seed and current player data to the newly connected client
    ws.send(JSON.stringify({ 
        type: 'REGISTER', 
        id: playerId, 
        players, 
        mapSeed 
    }));

    // Listen for messages from the client
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Handle position updates
        if (data.type === 'POSITION_UPDATE') {
            if (players[data.id]) {
                players[data.id].position = data.position;
                players[data.id].velocity = data.velocity;

                // Broadcast the updated position to all other clients
                broadcast({
                    type: 'UPDATE_POSITION',
                    id: data.id,
                    position: data.position
                }, ws);
            }
        }

        // Handle name updates
        if (data.type === 'NAME_UPDATE') {
            if (players[data.id]) {
                players[data.id].playerName = data.name;

                // Broadcast the updated name to all other clients
                broadcast({
                    type: 'UPDATE_NAME',
                    id: data.id,
                    name: data.name,
                }, ws);
            }
        }

        // Handle score updates
        if (data.type === 'SCORE_UPDATE') {
            if (players[data.id]) {
                players[data.id].score = data.score;

                // Broadcast the updated score to all other clients
                broadcast({
                    type: 'UPDATE_SCORE',
                    id: data.id,
                    score: data.score,
                }, ws);
            }
        }
    });

    // Handle player disconnection
    ws.on('close', () => {
        delete players[playerId];
        broadcast({ type: 'PLAYER_DISCONNECT', id: playerId });
    });
});

// Start the server
server.listen(8080, () => {
    console.log('WebSocket server running on port 8080');
});
