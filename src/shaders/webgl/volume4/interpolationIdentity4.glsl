#pragma glslify: AMItexture3D = require(../../utility/AMItexture3D.glsl)
#pragma glslify: unpack = require(../../utility/unpack.glsl)

void interpolationIdentity(
    in int uPixelType,
    in vec3 currentVoxel, 
    in int uTextureSize,
    in ivec3 uDataDimensions,
    in sampler2D uTextureContainer[7],
    in int uBitsAllocated,
    in int uNumberOfChannels,
    in int uPackedPerPixel,
    out vec4 dataValue
) {
    // lower bound
    vec3 rcurrentVoxel = vec3(floor(currentVoxel.x + 0.5 ), floor(currentVoxel.y + 0.5 ), floor(currentVoxel.z + 0.5 ));
    ivec3 flooredVoxel = ivec3(int(rcurrentVoxel.x), int(rcurrentVoxel.y), int(rcurrentVoxel.z));

    vec4 temporaryDataValue = vec4(0., 0., 0., 0.);

    // Unused in this version
    int dataOffset = 0;

    AMItexture3D(
        flooredVoxel, 
        uTextureSize,
        uDataDimensions,
        uTextureContainer,
        uPackedPerPixel,
        dataValue, 
        dataOffset
    );
}

#pragma glslify: export(interpolationIdentity)