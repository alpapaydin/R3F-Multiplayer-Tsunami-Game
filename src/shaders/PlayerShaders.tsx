// PlayerShaders.ts

export const ShaderA = {
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
  
      void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
  
      vec3 rainbow(float t) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.00, 0.33, 0.67);
          return a + b * cos(6.28318 * (c * t + d));
      }
  
      void main() {
          float pulse = sin(time * 2.0) * 0.5 + 0.5;
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
          vec3 rainbowColor1 = rainbow(vUv.x + time * 0.1);
          vec3 rainbowColor2 = rainbow(vUv.y + time * 0.15);
          vec3 blendedColor = mix(rainbowColor1, rainbowColor2, 0.5);
          vec3 glowColor = vec3(1.0, 1.0, 1.0);
          vec3 finalColor = mix(blendedColor, glowColor, (fresnel * 0.7 + pulse * 0.3) * 0.8);
          finalColor *= 1.5;
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  };
  
  export const ShaderB = {
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
  
      void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
  
      void main() {
          vec3 color = vec3(vUv, abs(sin(time)));
          gl_FragColor = vec4(color, 1.0);
      }
    `
  };
  
  export const ShaderC = {
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
  
      void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
  
      void main() {
          float intensity = abs(sin(time));
          vec3 glowColor = vec3(1.0, 0.5, 0.0) * intensity;
          gl_FragColor = vec4(glowColor, 1.0);
      }
    `
  };
  