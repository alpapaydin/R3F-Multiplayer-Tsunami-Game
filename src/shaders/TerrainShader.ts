import * as THREE from 'three';

// Function to blend height-based shader effects into a MeshStandardMaterial
const createBlendedTerrainMaterial = (heightTexture: THREE.Texture) => {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,  // Keep vertex color blending
    roughness: 0.9,
    metalness: 0.9, 
  });
  /*
  // Use onBeforeCompile to inject height-based logic
  mat.onBeforeCompile = (shader) => {
    // Inject the uniform for the height map and height multiplier
    shader.uniforms.u_heightMap = { value: heightTexture };
    shader.uniforms.u_heightMultiplier = { value: 10.0 };

    // Add custom vertex shader code to calculate height-based displacement
    shader.vertexShader = shader.vertexShader.replace(
      `#include <common>`,
      `#include <common>
       uniform sampler2D u_heightMap;
       uniform float u_heightMultiplier;
       varying float v_height;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `
      // Sample the height map and calculate height displacement
      vec4 heightData = texture2D(u_heightMap, uv);
      v_height = heightData.r * u_heightMultiplier;
      
      // Displace the vertex position based on the height
      vec3 transformed = position + normal * v_height;
      `
    );

    // Add custom fragment shader code to blend based on height
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `
      varying float v_height;

      // Apply color blending based on height
      vec3 heightColor;

      if (v_height < 0.3) {
        heightColor = mix(vec3(0.2, 0.5, 0.2), vec3(0.6, 0.3, 0.2), v_height / 0.3);  // Dark green to brown
      } else if (v_height < 0.6) {
        heightColor = mix(vec3(0.6, 0.3, 0.2), vec3(0.8, 0.8, 0.6), (v_height - 0.3) / 0.3);  // Brown to light beige
      } else {
        heightColor = mix(vec3(0.8, 0.8, 0.6), vec3(1.0, 1.0, 1.0), (v_height - 0.6) / 0.4);  // Light beige to white
      }

      // Blend the height color with the standard diffuse color
      vec3 finalColor = mix(diffuseColor.rgb, heightColor, 0.5);  // Blend 50% with the height color

      // Set the final fragment color with full opacity (no transparency)
      gl_FragColor = vec4(finalColor, 1.0);  // Full opacity
      `
    );
  };
  */
  return mat;
};

export default createBlendedTerrainMaterial;
