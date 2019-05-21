import { MaterialUtils } from "../MaterialUtils";

const vertSource = require('raw-loader!glslify-loader!../webgl/default.vert').default;
const fragmentSourceIdn = require ('raw-loader!glslify-loader!../webgl/volume/volume_idnInterp.frag').default;
const fragmentSourceTri = require ('raw-loader!glslify-loader!../webgl/volume/volume_triInterp.frag').default;

const vertSourcePP = require('raw-loader!glslify-loader!../webgl/volume4/volume_preProcess.vert').default;
const fragmentSourcePP = require ('raw-loader!glslify-loader!../webgl/volume/volume_preProcess.frag').default;

const THREE = (window as any).THREE;

export interface Volume4Uniforms {
    uTextureSize: { value: 0 },                 // int
    uTextureContainer: {                        // [ sampler2D ], length 7
        value: [
            THREE.Texture,
            THREE.Texture,
            THREE.Texture,
            THREE.Texture,
            THREE.Texture,
            THREE.Texture,
            THREE.Texture
        ]
    },
    uDataDimensions: { value: THREE.Vector3},   // ivec3
    uWorldToData: { value: THREE.Matrix4 },     // mat4
    uWindowCenterWidth: { value: number[] },    // [ float ], length 2
    uRescaleSlopeIntercept: { value: number[] },// [ float ], length 2
    uNumberOfChannels: { value: number },       // int
    uBitsAllocated: { value: number },          // int
    uTextureLUT: { value: THREE.Texture },      // sampler2D
    uPixelType: { value: number },              // int
    uPackedPerPixel: { value: number },         // int
    uWorldBBox: { value: number[] },            // [ float ], length 6     
    uSteps: { value: number },                  // int
    uAlphaCorrection: { value: number },        // float
    uAmbient: { value: number },                // float
    uAmbientColor: { value: THREE.Vector3 },    // vec3(1)
    uSampleColorToAmbient: { value: number },   // int
    uSpecular: { value: number },               // float
    uSpecularColor: { value: THREE.Vector3 },   // vec3(1)
    uDiffuse: { value: number },                // float
    uDiffuseColor: { value:THREE.Vector3 },     // vec3(1)
    uSampleColorToDiffuse: { value: number },   // int
    uShininess: { value: number },              // float
    uLightPosition: { value: THREE.Vector3 },   // vec3(0)
    uLightPositionInCamera: { value: number },  // int
    uIntensity: { value: THREE.Vector3 },       // vec3(0)
}

export interface PreProcessVolume4Uniforms {
    uTexture: { value: THREE.Texture},          // sampler2D
    uNumberOfChannels: { value: number },       // int
    uBitsAllocated: { value: number },          // int
    uPixelType: { value: number },              // int
    uPackedPerPixel: { value: number },         // int
}

export class Volume4Material {
    private static _shaderName = 'volume';
    public static get shaderName() {
        return Volume4Material._shaderName;
    }

    /**
     * Singleton static for the shader material, 
     * will always return a mutable clone of the base version
     * of the shader
     */
    private static _idnMaterial: THREE.ShaderMaterial;
    private static _triMaterial: THREE.ShaderMaterial;

    private static _preprocessMaterial: THREE.ShaderMaterial;

    /**
     * Default Uniform values
     */
    private static _defaultUniforms = {
        uTextureSize: { value: 0 },                     // int
        uTextureContainer: {                            // [ sampler2D ], length 7
            value: [
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture(),
                new THREE.Texture()
            ]
        },
        uDataDimensions: { value: new THREE.Vector3()}, // ivec3
        uWorldToData: { value: new THREE.Matrix4() },   // mat4
        uWindowCenterWidth: { value: [0.0, 0.0] },      // [ float ], length 2
        uRescaleSlopeIntercept: { value: [0.0, 0.0] },  // [ float ], length 2
        uNumberOfChannels: { value: 1 },                // int
        uBitsAllocated: { value: 8 },                   // int
        uTextureLUT: { value: new THREE.Texture()},     // sampler2D
        uPixelType: { value: 0 },                       // int
        uPackedPerPixel: { value: 1 },                  // int
        uWorldBBox: { value: [0.0, 0.0, 0.0,            // [ float ], length 6
            0.0, 0.0, 0.0] 
        },              
        uSteps: { value: 16 },                          // int
        uAlphaCorrection: { value: 0.5 },               // float
        uAmbient: { value: 0.1 },                       // float
        uAmbientColor: { value:                         // vec3(1)
            new THREE.Vector3(1.0, 1.0, 1.0)
        },
        uSampleColorToAmbient: { value: 1 },            // int
        uSpecular: { value: 1.0 },                      // float
        uSpecularColor: { value:                        // vec3(1)
            new THREE.Vector3(1.0, 1.0, 1.0)
        },
        uDiffuse: { value: 0.3 },                       // float
        uDiffuseColor: { value:                         // vec3(1)
            new THREE.Vector3(1.0, 1.0, 1.0)
        },
        uSampleColorToDiffuse: { value: 1 },            // int
        uShininess: { value: 5.0 },                     // float
        uLightPosition: { value:                        // vec3(0)
            new THREE.Vector3(0.0, 0.0, 0.0)
        },
        uLightPositionInCamera: { value: 1 },           // int
        uIntensity: { value:                            // vec3(0)
            new THREE.Vector3(0.8, 0.8, 0.8)
        },
    } as Volume4Uniforms;

    private static _preProcessDefaultUniforms = {
        uTexture: { value: new THREE.Texture() },  // sampler2D
        uNumberOfChannels: { value: 1 },           // int
        uBitsAllocated: { value: 8 },              // int
        uPixelType: { value: 0 },                  // int
        uPackedPerPixel: { value: 1  }             // int
    } as PreProcessVolume4Uniforms;

    public static get defaultUniforms() {
        return Volume4Material._defaultUniforms;
    }

    public static get preProcessDefaultUniforms() {
        return Volume4Material._preProcessDefaultUniforms;
    }

    public static get idnMaterial(): THREE.ShaderMaterial {
        if (!Volume4Material._idnMaterial) {
            Volume4Material._idnMaterial = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                transparent: true,
                uniforms: this.defaultUniforms,
                vertexShader: MaterialUtils.processSource(vertSource),
                fragmentShader: MaterialUtils.processSource(fragmentSourceIdn),
            });
        }
        return Volume4Material._idnMaterial.clone();
    }

    public static get triMaterial(): THREE.ShaderMaterial {
        if (!Volume4Material._triMaterial) {
            Volume4Material._triMaterial = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                transparent: true,
                uniforms: this.defaultUniforms,
                vertexShader: MaterialUtils.processSource(vertSource),
                fragmentShader: MaterialUtils.processSource(fragmentSourceTri),
            });
        }
        return Volume4Material._triMaterial.clone();
    }

    public static get preprocessMaterial(): THREE.ShaderMaterial {
        if (!Volume4Material._preprocessMaterial) {
            Volume4Material._preprocessMaterial = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                transparent: true,
                uniforms: this.preProcessDefaultUniforms,
                vertexShader: MaterialUtils.processSource(vertSourcePP),
                fragmentShader: MaterialUtils.processSource(fragmentSourcePP),
            });
        }
        return Volume4Material._preprocessMaterial.clone();
    }
}