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
  
  export const ShaderCool = {
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
  
      // Function to create wave distortion
      float waveDistortion(vec2 uv, float time, float amplitude, float frequency) {
          return sin(uv.x * frequency + time * 5.0) * amplitude;
      }
  
      // Fresnel effect to create the glow based on angle of view
      float fresnelEffect(vec3 normal, vec3 viewDir) {
          return pow(1.0 - dot(normal, viewDir), 3.0);
      }
  
      void main() {
          // Pulsating effect
          float pulse = abs(sin(time * 2.0)) * 0.5 + 0.5;
  
          // Apply wave distortion to UV coordinates
          float distortion = waveDistortion(vUv, time, 0.05, 10.0);
          vec2 distortedUV = vUv + vec2(distortion, distortion);
  
          // Blend red and white colors
          vec3 redColor = vec3(1.0, 0.0, 0.0);  // Red
          vec3 whiteColor = vec3(1.0, 1.0, 1.0);  // White
          vec3 finalColor = mix(redColor, whiteColor, distortedUV.x);
  
          // Calculate Fresnel effect for edge glow
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = fresnelEffect(normal, viewDir);
  
          // Combine everything with the pulse
          finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), fresnel * 0.8 + pulse * 0.2);
  
          // Make the final color brighter
          finalColor *= 1.5;
  
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  };
  export const kale = {
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
  
      void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      #define pi 3.14159265359
  
      uniform float time;
      uniform vec2 iResolution;
  
      // Simple hash function to create pseudo-random numbers
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
  
      // 2D noise function based on the hash function
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
  
      vec2 kaleido(vec2 uv) {
          float th = atan(uv.y, uv.x);
          float r = pow(length(uv), 1.0);
  
          float p1 = sin(2.0 * pi * time / 10.0);
          float q = 2.0 * pi / (5.0 + 4.0 * p1);
          th = abs(mod(th, q) - 0.5 * q);
          return vec2(cos(th), sin(th)) * pow(r, 1.3 + 1.3 / (1.3 + sin(2.0 * pi * time / 3.0))) * 0.1;
      }
  
      vec2 transform(vec2 at) {
        vec2 v;
        float th = 0.1 * time;
        v.x = at.x * cos(th) - at.y * sin(th) - 0.3 * sin(th);
        v.y = at.x * sin(th) + at.y * cos(th) + 0.3 * cos(th);
        return v;
      }
  
      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        uv.x = mix(-1.0, 1.0, uv.x);
        uv.y = mix(-1.0, 1.0, uv.y);
        uv.y *= iResolution.y / iResolution.x;
  
        // Generate noise for the scene in place of a texture
        vec2 noiseCoords = kaleido(uv) * 10.0;
        float noiseValue = noise(noiseCoords);
  
        // Final color using the noise
        vec3 color = vec3(noiseValue, noiseValue, noiseValue);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  };