import { MaterialUtils } from "../MaterialUtils";

const vertSource = require('raw-loader!glslify-loader!../../webgl/default.vert').default;
const fragmentSourceIdn = require ('raw-loader!glslify-loader!../../webgl/volume3/volume_idnInterp.frag').default;
const fragmentSourceTri = require ('raw-loader!glslify-loader!../../webgl/volume3/volume_triInterp.frag').default;

const THREE = (window as any).THREE;

export interface Volume3Uniforms {
    uWorldToData: { value: THREE.Matrix4 },     // mat4
    uTextureLUT: { value: THREE.Texture },      // sampler2D
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
    uIntensityData: {value: THREE.DataTexture3D } //sampler3D
    uGradientData: {value: THREE.DataTexture3D } //sampler3D
}

export class Volume3Material {
    private static _shaderName = 'volume3';
    public static get shaderName() {
        return Volume3Material._shaderName;
    }

    private static _idnMaterial: THREE.ShaderMaterial;
    private static _triMaterial: THREE.ShaderMaterial;

    private static _defaultUniforms = {
        uWorldToData: { value: new THREE.Matrix4() },   // mat4
        uTextureLUT: { value: new THREE.Texture()},     // sampler2D
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
        uIntensityData: { value: new THREE.DataTexture3D() }, // Sampler3D
        uGradientData: { value: new THREE.DataTexture3D() } // Sampler3D
    } as Volume3Uniforms;

    public static get defaultUniforms() {
        return Volume3Material._defaultUniforms;
    }

    public static get idnMaterial(): THREE.ShaderMaterial {
        if (!Volume3Material._idnMaterial) {
            Volume3Material._idnMaterial = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                transparent: true,
                uniforms: this.defaultUniforms,
                vertexShader: MaterialUtils.processSource(vertSource),
                fragmentShader: MaterialUtils.processSource(fragmentSourceIdn),
            });
        }
        return Volume3Material._idnMaterial.clone();
    }

    public static get triMaterial(): THREE.ShaderMaterial {
        if (!Volume3Material._triMaterial) {
            Volume3Material._triMaterial = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                transparent: true,
                uniforms: this.defaultUniforms,
                vertexShader: MaterialUtils.processSource(vertSource),
                fragmentShader: MaterialUtils.processSource(fragmentSourceTri),
            });
        }
        return Volume3Material._triMaterial.clone();
    }
}