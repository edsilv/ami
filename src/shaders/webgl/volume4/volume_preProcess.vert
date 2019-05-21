

// THREEJS Provided uniforms
// uniform mat4 modelMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// attribute vec3 position;

attribute vec2 aTexCoord;

varying vec4 vPos;
varying mat4 vProjectionViewMatrix;
varying vec4 vProjectedCoords;
varying vec2 vTexCoord;

void main() {
    vPos = modelMatrix * vec4(position, 1.0 );
    vProjectionViewMatrix = projectionMatrix * viewMatrix;
    vProjectedCoords =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    vTexCoord = aTexCoord;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}