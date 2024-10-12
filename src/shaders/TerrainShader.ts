import * as THREE from 'three';

// Define vertex and fragment shaders
const vertexShader = `
  uniform float u_heightMultiplier;
  uniform sampler2D u_heightMap;
  uniform sampler2D u_temperatureMap;
  uniform sampler2D u_humidityMap;

  varying float v_height;
  varying float v_temperature;
  varying float v_humidity;

  void main() {
    vec4 heightData = texture2D(u_heightMap, uv);
    vec4 tempData = texture2D(u_temperatureMap, uv);
    vec4 humidityData = texture2D(u_humidityMap, uv);

    v_height = heightData.r * u_heightMultiplier;
    v_temperature = tempData.r;
    v_humidity = humidityData.r;

    vec3 newPosition = position + normal * v_height;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 u_colorPlains;
  uniform vec3 u_colorMountains;
  uniform vec3 u_colorDesert;
  uniform vec3 u_colorForest;

  varying float v_height;
  varying float v_temperature;
  varying float v_humidity;

  void main() {
    vec3 color;

    // Select biome color based on temperature and humidity
    if (v_temperature > 0.7 && v_humidity < 0.3) {
      color = u_colorDesert;  // Desert biome
    } else if (v_temperature < 0.3 && v_humidity > 0.6) {
      color = u_colorForest;  // Forest biome
    } else if (v_temperature > 0.7 && v_humidity > 0.7) {
      color = u_colorMountains;  // Mountains biome
    } else {
      color = u_colorPlains;  // Plains biome
    }

    // Apply height-based shading (darker at lower heights)
    float heightFactor = smoothstep(0.0, 1.0, v_height);
    color *= mix(vec3(0.5), vec3(1.0), heightFactor);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Create and export the shader material
export function createTerrainMaterial(heightMap, temperatureMap, humidityMap) {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_heightMap: { value: heightMap },
      u_temperatureMap: { value: temperatureMap },
      u_humidityMap: { value: humidityMap },
      u_heightMultiplier: { value: 10.0 },
      u_colorPlains: { value: new THREE.Color(0x7cfc00) },
      u_colorMountains: { value: new THREE.Color(0x808080) },
      u_colorDesert: { value: new THREE.Color(0xffd700) },
      u_colorForest: { value: new THREE.Color(0x228b22) },
    },
    vertexShader,
    fragmentShader,
  });
}
