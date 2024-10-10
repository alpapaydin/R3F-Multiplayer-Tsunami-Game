export const vertexShader = `
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
`;

export const fragmentShader = `
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
        // Create a more pronounced pulsating effect
        float pulse = sin(time * 2.0) * 0.5 + 0.5;

        // Calculate fresnel effect for the glow
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);

        // Generate rainbow colors
        vec3 rainbowColor1 = rainbow(vUv.x + time * 0.1);
        vec3 rainbowColor2 = rainbow(vUv.y + time * 0.15);
        
        // Blend rainbow colors
        vec3 blendedColor = mix(rainbowColor1, rainbowColor2, 0.5);

        // Increase glow
        vec3 glowColor = vec3(1.0, 1.0, 1.0); // White glow
        
        // Blend the rainbow color with the glow color based on the pulse and fresnel
        vec3 finalColor = mix(blendedColor, glowColor, (fresnel * 0.7 + pulse * 0.3) * 0.8);

        // Brighten the color
        finalColor *= 1.5;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;