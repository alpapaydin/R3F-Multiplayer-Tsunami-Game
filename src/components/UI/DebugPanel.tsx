import React from 'react';
import * as THREE from 'three';
import './DebugPanel.css';

interface DebugPanelProps {
  latency: number;
  position: THREE.Vector3;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ latency, position }) => {
  return (
    <div className="debug-panel">
      <h3>Debug Info</h3>
      <p>
        <span className="label">Latency:</span>
        <span className="value">{latency.toFixed(2)} ms</span>
      </p>
      <p>
        <span className="label">Position:</span>
        <span className="value">
          X: {position.x.toFixed(2)},
          Y: {position.y.toFixed(2)},
          Z: {position.z.toFixed(2)}
        </span>
      </p>
    </div>
  );
};

export default DebugPanel;