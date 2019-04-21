 
import { Volume3Material, Volume3Uniforms } from '../shaders';
import { BaseTHREEHelper } from './BaseTHREEHelper';

const THREE = (window as any).THREE;

interface intensityResult {
    intensity: number,
    gradient: THREE.Vector3
}

export class VolumeRenderHelper3 extends BaseTHREEHelper {
  //#region Variables 
  private _alphaCorrection: number = 0.5;
  private _shininess: number = 10.0;
  private _steps: number = 32;
  private _offset: number = 0;
  private _textureLUT: THREE.Texture;

  private _dataTexture: THREE.DataTexture3D;
  private _gradientTexture: THREE.DataTexture3D
  private _unpackedVoxels: Float32Array;
  //#endregion

  //#region Getters
  get windowCenter(): number {
    return this._windowCenter;
  }
  get windowWidth(): number {
    return this._windowWidth;
  }
  get textureLUT(): THREE.Texture {
    return this._textureLUT;
  }
  get steps() {
    return this._steps;
  }
  get alphaCorrection() {
    return this._alphaCorrection;
  }
  get interpolation() {
    return this._interpolation;
  }
  get shininess() {
    return this._shininess;
  }
  //#endregion

  //#region Setters 
  set textureLUT(value: THREE.Texture) {
    this._textureLUT = value;
    this._material.uniforms.uTextureLUT.value = this._textureLUT;
  }
  set windowCenter(value: number) {
    this._windowCenter = value;
    this._material.uniforms.uWindowCenterWidth.value = [
      this._windowCenter - this._offset,
      this._windowWidth,
    ];
  }
  set windowWidth(value: number) {
    this._windowWidth = value;
    this._material.uniforms.uWindowCenterWidth.value = [
      this._windowCenter - this._offset,
      this._windowWidth,
    ];
  }
  set steps(steps: number) {
    this._steps = steps;
    this._material.uniforms.uSteps.value = this._steps;
  }
  set alphaCorrection(alphaCorrection: number) {
    this._alphaCorrection = alphaCorrection;
    this._material.uniforms.uAlphaCorrection.value = this._alphaCorrection;
  }
  set interpolation(interpolation: number) {
    this._interpolation = interpolation;

    if (interpolation === 0) {
      this._material = Volume3Material.idnMaterial;
    }
    else {
      this._material = Volume3Material.triMaterial;
    }

    this._prepareMaterial();
  }
  set shininess(shininess: number) {
    this._shininess = shininess;
    this._material.uniforms.uShininess.value = this._shininess;
  }
  //#endregion

  constructor(stack: any) {
    super(stack);
    this._init();
    this._create();
  }

  protected _init() {
    this._material = Volume3Material.triMaterial;
    this._prepareStack();
    this._prepareTexture();
    this._prepareMaterial();
    this._prepareGeometry();
  }

  protected _create() {
    this._material.needsUpdate = true;
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this.add(this._mesh);
  }

  private _prepareStack() {
    if (!this._stack.prepared) {
      this._stack.prepare();
    }

    if (!this._stack.packed) {
      this._stack.pack();
    }

    // compensate for the offset to only pass > 0 values to shaders
    // models > models.stack.js : _packTo8Bits
    this._offset = Math.min(0, this._stack._minMax[0]);
    this._windowCenter = this._stack.windowCenter;
    this._windowWidth = this._stack.windowWidth * 0.8; // multiply for better default visualization

    const totalNbOfVoxels = this.stack._dimensionsIJK.x * this.stack._dimensionsIJK.y * this.stack._dimensionsIJK.z;
    this._unpackedStack = new Float32Array(totalNbOfVoxels);

    for (let i = 0; i < this._stack.frame.length; i++) {
        const frame = this.stack.frame[i];
        // For each pixel in the frame
        for(let j = 0; j < frame.rows; j++) {
            for (let k = 0; k < frame._columns; k++) {
                // Define pixel index
                const idx: number = i  *  frame._rows *  frame._columns + k;
                // Get raw data value
                const rawPixel: number = frame.pixelData[k];
                // Unpack and Cache the stack value
                this._unpackedStack[idx] = this._unpackStackPixel(rawPixel, i, j, k);
            }
        }
    }
  }

  private _prepareMaterial() {
    this._material.uniforms.uWorldToData.value = this._stack.lps2IJK;
    this._material.uniforms.uTextureLUT.value = this._textureLUT;
    this._material.uniforms.uWorldBBox.value = this._stack.worldBoundingBox();            
    this._material.uniforms.uSteps.value = this._steps;
    this._material.uniforms.uAlphaCorrection.value = this._alphaCorrection;        
    this._material.uniforms.uShininess.value = this._shininess;
    this._material.uniforms.uIntensityData.value = this._dataTexture;

    this._processData();

    this._material.needsUpdate = true;
  }

  /**
   * Perform Unpacking on data prior to rendering
   */
  private _processData() {
    const totalNbOfVoxels = this.stack._dimensionsIJK.x * this.stack._dimensionsIJK.y * this.stack._dimensionsIJK.z;
    const intensityArray = new Float32Array(totalNbOfVoxels);
    const gradientArray = new Float32Array(totalNbOfVoxels * 3);
    
    const tempGradientArray = [];

    const windowCenter = this._material.uniforms.uWindowCenterWidth.value[0];
    const windowWidth = this._material.uniforms.uWindowCenterWidth.value[1];
    // Get the minimum of the window
    const windowMin = windowCenter - windowWidth * 0.5;

    const rescaleSlope = this._material.uniforms.uRescaleSlopeIntercept.value[0];
    const rescaleIntercept = this._material.uniforms.uRescaleSlopeIntercept.value[1];

    // Intensity calculations happen every time a uniform is changed
    // For each frame in the stack
    for (let i = 0; i < this._stack.frame.length; i++) {
        const frame = this.stack.frame[i];
        // For each pixel in the frame
        for(let j = 0; j < frame.rows; j++) {
            for (let k = 0; k < frame._columns; k++) {
                // Define pixel index
                const idx: number = (i  *  frame._rows) +  (j * frame._columns) + k;
                // Get raw data value
                let processedPixel: number;
                
                if (this._interpolation === 0) {
                    processedPixel = this._unpackedVoxels[idx];
                }
                else {
                    let currentVoxel = new THREE.Vector3(i, j, k);
                    let res = this._trilinearVoxelInterpolation(currentVoxel, frame);
                    processedPixel = res.intensity;
                    tempGradientArray.push(res.gradient);
                }

                // window level
                let intensity: number = ( processedPixel - windowMin ) / windowWidth;
                // rescale/slope
                intensity = intensity*rescaleSlope + rescaleIntercept;
    
                intensityArray[idx] = intensity;
            }
        }
    }

    // Allocate the gradient F32 array
    for (let g = 0; g < totalNbOfVoxels * 3; g +=3) {
        const gradient = tempGradientArray[g / 3];
        gradientArray[g] = gradient.x;
        gradientArray[g + 1] = gradient.y;
        gradientArray[g + 2] = gradient.z;
    }

    this._dataTexture = new THREE.DataTexture3D(
        intensityArray,
        this._stack.dimensionsIJK.x,
        this._stack.dimensionsIJK.y,
        this._stack.dimensionsIJK.z
    );				
    this._dataTexture.format = THREE.RedFormat;
    this._dataTexture.type = THREE.FloatType;
    this._dataTexture.minFilter = THREE.LinearFilter;
    this._dataTexture.magFilter = THREE.LinearFilter;
    // Unpack each value as a new Vec4, instead of merging several into a single vec4
    this._dataTexture.unpackAlignment = 1;
    this._dataTexture.needsUpdate = true;

    (this._material.uniforms as unknown as Volume3Uniforms).uIntensityData.value = this._dataTexture;

    this._gradientTexture = new THREE.DataTexture3D(
        gradientArray,
        this._stack.dimensionsIJK.x,
        this._stack.dimensionsIJK.y,
        this._stack.dimensionsIJK.z
    );				
    this._gradientTexture.format = THREE.RGBFormat;
    this._gradientTexture.type = THREE.FloatType;
    this._gradientTexture.minFilter = THREE.LinearFilter;
    this._gradientTexture.magFilter = THREE.LinearFilter;
    // Unpack each value as a new Vec3, instead of merging several into a single vec4
    this._gradientTexture.unpackAlignment = 3;
    this._gradientTexture.needsUpdate = true;

    (this._material.uniforms as unknown as Volume3Uniforms).uGradientData.value = this._gradientTexture;
  }

  // Unpacking only happens once, at load-time
  private _unpackStackPixel(rawPixel: number, i: number, j: number, k: number): number {
    if (this._stack.numberOfChannels === 1) {
        if (this._stack.bitsAllocated === 8) {
            return rawPixel / 255.0;
        }
        else {
            console.error("Unpacking for non-unsigned-byte data is undefined!");
        }
        // if (this._stack.bitsAllocated === 16) {
        //     unpack16(    
        //         packedData, 
        //         offset, 
        //         unpackedData
        //     );
        //     return;
        // }
        // if (this._stack.bitsAllocated === 32) {
        //     unpack32(    
        //         packedData, 
        //         offset, 
        //         uPixelType,
        //         unpackedData
        //     );
        //     return;
        // }
    } 
    else {
        console.error("Unpacking for non-unsigned-byte data is undefined!");
    }
    // unpackIdentity(
    //     packedData, 
    //     offset, 
    //     unpackedData
    // );
  }

  private _trilinearVoxelInterpolation(currentVoxel: THREE.Vector3, frame: any): intensityResult {
    const GRADIENT_STEP: number = 0.005;
    const EPSILON: number = 0.0000152587;

    let res = {
        intensity: 0,
        gradient: new THREE.Vector3(0, 0, 0)
    } as intensityResult;

    let lowerBound: THREE.Vector3  = new THREE.Vector3(
        Math.max(Math.floor(currentVoxel.x), 0), 
        Math.max(Math.floor(currentVoxel.y), 0), 
        Math.max(Math.floor(currentVoxel.z), 0)
    );

    let upperBound: THREE.Vector3  = new THREE.Vector3(
        lowerBound.x + 1, 
        lowerBound.y + 1, 
        lowerBound.z + 1
    );

    let normalizedPosition: THREE.Vector3 = new THREE.Vector3(
        Math.max((currentVoxel.x - lowerBound.x), 0),
        Math.max((currentVoxel.y - lowerBound.y), 0),
        Math.max((currentVoxel.z - lowerBound.z), 0),
    );

    const idx000: number = (lowerBound.x  *  frame._rows) +  (lowerBound.y * frame._columns) + lowerBound.z;
    let v000: number = this._unpackedVoxels[idx000];

    const idx100: number = (upperBound.x  *  frame._rows) +  (lowerBound.y * frame._columns) + lowerBound.z;
    let v100: number = this._unpackedVoxels[idx100];

    const idx001: number = (lowerBound.x  *  frame._rows) +  (lowerBound.y * frame._columns) + upperBound.z;
    let v001: number = this._unpackedVoxels[idx001];

    const idx101: number = (upperBound.x  *  frame._rows) +  (lowerBound.y * frame._columns) + upperBound.z;
    let v101: number = this._unpackedVoxels[idx101];

    const idx010: number = (lowerBound.x  *  frame._rows) +  (upperBound.y * frame._columns) + lowerBound.z;
    let v010: number = this._unpackedVoxels[idx010];

    const idx110: number = (upperBound.x  *  frame._rows) +  (upperBound.y * frame._columns) + lowerBound.z;
    let v110: number = this._unpackedVoxels[idx110];

    const idx011: number = (lowerBound.x  *  frame._rows) +  (upperBound.y * frame._columns) + upperBound.z;
    let v011: number = this._unpackedVoxels[idx011];

    const idx111: number = (upperBound.x  *  frame._rows) +  (upperBound.y * frame._columns) + upperBound.z;
    let v111: number = this._unpackedVoxels[idx111];

    // compute interpolation at position
    res.intensity = this._trilinearInterpolation(normalizedPosition, v000, v100, v001, v101, v010, v110, v011, v111);

    // x axis
    let g100: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
    let ng100: THREE.Vector3 = normalizedPosition.clone().add(g100.multiplyScalar(GRADIENT_STEP));
    ng100.x = Math.min(1.0, ng100.x);
    let vg100: number = this._trilinearInterpolation(ng100, v000, v100, v001, v101, v010, v110, v011, v111);

    let go100: THREE.Vector3 = g100.clone().multiplyScalar(-1);
    let ngo100: THREE.Vector3 = normalizedPosition.clone().add(go100.multiplyScalar(GRADIENT_STEP));
    ngo100.x = Math.max(0., ngo100.x);
    let vgo100: number = this._trilinearInterpolation(ngo100, v000, v100, v001, v101, v010, v110, v011, v111);

    res.gradient.x = (g100.x * vg100 + go100.x * vgo100);

    // y axis
    let g010: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
    let ng010: THREE.Vector3 = normalizedPosition.clone().add(g010.multiplyScalar(GRADIENT_STEP));
    ng010.y = Math.min(1, ng010.y);
    let vg010 = this._trilinearInterpolation(ng010, v000, v100, v001, v101, v010, v110, v011, v111);

    let go010: THREE.Vector3 = g010.clone().multiplyScalar(-1);
    let ngo010: THREE.Vector3 = normalizedPosition.clone().add(go010.multiplyScalar(GRADIENT_STEP));
    ngo010.y = Math.max(0, ngo010.y);
    let vgo010 = this._trilinearInterpolation(ngo010, v000, v100, v001, v101, v010, v110, v011, v111);

    res.gradient.y = (g010.y * vg010 + go010.y * vgo010);

    // z axis
    let g001: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
    let ng001: THREE.Vector3 = normalizedPosition.clone().add(g001.multiplyScalar(GRADIENT_STEP));
    ng001.z = Math.min(1, ng001.z);
    let vg001 = this._trilinearInterpolation(ng001, v000, v100, v001, v101, v010, v110, v011, v111);

    let go001: THREE.Vector3 = g001.clone().multiplyScalar(-1);
    let ngo001: THREE.Vector3 = normalizedPosition.clone().add(go001.multiplyScalar(GRADIENT_STEP));
    ngo001.z = Math.max(0, ngo001.z);
    let vgo001 = this._trilinearInterpolation(ngo001, v000, v100, v001, v101, v010, v110, v011, v111);

    res.gradient.z = (g001.z * vg001 + go001.z * vgo001);

    res.gradient = res.gradient.clone().multiplyScalar((1.0 / (res.gradient.length() + EPSILON))).multiplyScalar(-1);

    return res;
  }

  private _trilinearInterpolation(
    normalizedPosition: THREE.Vector3,
    v000: number, v100: number,
    v001: number, v101: number,
    v010: number, v110: number,
    v011: number, v111: number
): number {
    let interpolatedValue: number;

    // https://en.wikipedia.org/wiki/Trilinear_interpolation
    let c00 = v000 * ( 1.0 - normalizedPosition.x ) + v100 * normalizedPosition.x;
    let c01 = v001 * ( 1.0 - normalizedPosition.x ) + v101 * normalizedPosition.x;
    let c10 = v010 * ( 1.0 - normalizedPosition.x ) + v110 * normalizedPosition.x;
    let c11 = v011 * ( 1.0 - normalizedPosition.x ) + v111 * normalizedPosition.x;

    // c0 and c1
    let c0 = c00 * ( 1.0 - normalizedPosition.y) + c10 * normalizedPosition.y;
    let c1 = c01 * ( 1.0 - normalizedPosition.y) + c11 * normalizedPosition.y;

    // c
    interpolatedValue = c0 * ( 1.0 - normalizedPosition.z) + c1 * normalizedPosition.z;
    return interpolatedValue;
}

  private _prepareGeometry() {
    const worldBBox = this._stack.worldBoundingBox();
    const centerLPS = this._stack.worldCenter();

    this._geometry = new THREE.BoxGeometry(
      worldBBox[1] - worldBBox[0],
      worldBBox[3] - worldBBox[2],
      worldBBox[5] - worldBBox[4]
    );
    this._geometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(centerLPS.x, centerLPS.y, centerLPS.z)
    );
  }

  // Release memory
  public dispose() {
    for (let j = 0; j < this._textures.length; j++) {
      this._textures[j].dispose();
      this._textures[j] = null;
    }
    this._textures = null;

    // material, geometry and mesh
    this.remove(this._mesh);
    this._mesh.geometry.dispose();
    this._mesh.geometry = null;
    this._mesh.material.dispose();
    this._mesh.material = null;
    this._mesh = null;

    this._geometry.dispose();
    this._geometry = null;
    this._material.vertexShader = null;
    this._material.fragmentShader = null;
    this._material.uniforms = null;
    this._material.dispose();
    this._material = null;

    this._stack = null;
  }
}




