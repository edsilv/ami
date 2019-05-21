#pragma glslify: intersectsBox = require(../../utility/intersectsBox.glsl)
#pragma glslify: getIntensityTri = require(./getIntensityTri4.glsl)
#pragma glslify: invertMat4 = require(../../utility/invertMat4.glsl)
#pragma glslify: AMIphong = require(../../utility/AMIphong.glsl)
#pragma glslify: highpRandF32 = require(../../utility/highpRandF32.glsl)

uniform sampler2D uTexture;
uniform int uNumberOfChannels;
uniform int uBitsAllocated;
uniform int uPixelType;
uniform int uPackedPerPixel;

varying vec4 vPos;
varying mat4 vProjectionViewMatrix;
varying vec4 vProjectedCoords;
varying vec2 vTexCoord;

void main(void) {
  // Get raw pixel data from input texture
  vec4 rawPixelData = texture2D(uTexture, vTexCoord);

  vec4 result = vec4(0, 0, 0, 0);

  // IF 8 bit data
  if (uPackedPerPixel == 4) {
    vec4 temp;

    // Pixel 1
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      0,
      temp
    );
    result.r = temp.r;

    // Pixel 2
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      0,
      temp
    );
    result.g = temp.r;

    // Pixel 3
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      0,
      temp
    );
    result.b = temp.r;

    // Pixel 4
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      0,
      temp
    );
    result.a = temp.r;
  }

  // IF 16 bit data
  if (uPackedPerPixel == 2) {
    vec4 temp;

    // Pixel 1
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      0,
      temp
    );
    result.r = temp.r;

    // Pixel 2
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      1,
      temp
    );
    result.b = temp.r;
  }

  // IF 32 bit data
  if (uPackedPerPixel == 1) {
    vec4 temp;

    // Pixel 1
    unpack(
      uPixelType,
      uBitsAllocated,
      uNumberOfChannels,
      rawPixelData,
      0,
      temp
    );
    result = temp;
  }

  gl_FragColor = result;
}