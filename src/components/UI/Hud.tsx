import React from 'react';
import './Hud.css';

interface PlayerState {
  name: string;
  score: number;
}

interface HudProps {
  players: { [key: string]: PlayerState };
  currentPlayerId: string | null;
}

type PlayerEntry = [string, PlayerState];

const Hud: React.FC<HudProps> = ({ players, currentPlayerId }) => {
    //list top 10 players
  const sortedPlayers = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
  const top10Players = sortedPlayers.slice(0, 10);
  const currentPlayerIndex = sortedPlayers.findIndex(([id]) => id === currentPlayerId);
  const isCurrentPlayerInTop10 = currentPlayerIndex < 10;

  const playersToDisplay: (PlayerEntry | 'spacer')[] = isCurrentPlayerInTop10
    ? top10Players
    : [...top10Players, 'spacer', sortedPlayers[currentPlayerIndex]];

  return (
    <div className="hud-container">
      <h2 className="hud-title">Scoreboard</h2>
      <table className="hud-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {playersToDisplay.map((entry, index) => {
            if (entry === 'spacer') {
              return (
                <tr key="spacer" className="spacer">
                  <td colSpan={3}>...</td>
                </tr>
              );
            }

            const [playerId, player] = entry;
            return (
              <tr 
                key={playerId}
                className={playerId === currentPlayerId ? 'current-player' : ''}
              >
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{player.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Hud;