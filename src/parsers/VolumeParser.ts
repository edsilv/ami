/**
 * @module parsers/volume
 */
export default class VolumeParser {
  public _rightHanded: boolean;

  constructor() {
    this._rightHanded = true;
  }

  public pixelRepresentation() {
    return 0;
  }

  public pixelPaddingValue(_frameIndex: number = 0) {
    return null;
  }

  public modality() {
    return 'unknown';
  }

  public segmentationType() {
    return 'unknown';
  }

  public segmentationSegments() {
    return [];
  }

  public referencedSegmentNumber(_frameIndex: number) {
    return -1;
  }

  public rightHanded() {
    return this._rightHanded;
  }

  public spacingBetweenSlices() {
    return null;
  }

  public numberOfChannels() {
    return 1;
  }

  public sliceThickness() {
    return null;
  }

  public dimensionIndexValues(_frameIndex: number = 0) {
    return null;
  }

  public instanceNumber(frameIndex: number = 0) {
    return frameIndex;
  }

  public windowCenter(_frameIndex: number = 0) {
    return null;
  }

  public windowWidth(_frameIndex: number = 0) {
    return null;
  }

  public rescaleSlope(_frameIndex: number = 0) {
    return 1;
  }

  public rescaleIntercept(_frameIndex: number = 0) {
    return 0;
  }

  public ultrasoundRegions(_frameIndex: number = 0) {
    return [];
  }

  public frameTime(_frameIndex: number = 0) {
    return null;
  }

  // tslint:disable-next-line: no-empty
  public _decompressUncompressed() {}

  // http://stackoverflow.com/questions/5320439/how-do-i-swap-endian-ness-byte-order-of-a-variable-in-javascript
  // tslint:disable-next-line: no-any
  public _swap16(val: any) {
    // tslint:disable-next-line: no-bitwise
    return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
  }

  // tslint:disable-next-line: no-any
  public _swap32(val: any) {
    return (
      // tslint:disable-next-line: no-bitwise
      ((val & 0xff) << 24) |
      // tslint:disable-next-line: no-bitwise
      ((val & 0xff00) << 8) |
      // tslint:disable-next-line: no-bitwise
      ((val >> 8) & 0xff00) |
      // tslint:disable-next-line: no-bitwise
      ((val >> 24) & 0xff)
    );
  }

  public invert() {
    return false;
  }

  /**
   * Get the transfer syntax UID.
   * @return {*}
   */
  public transferSyntaxUID() {
    return 'no value provided';
  }

  /**
   * Get the study date.
   * @return {*}
   */
  public studyDate() {
    return 'no value provided';
  }

  /**
   * Get the study desciption.
   * @return {*}
   */
  public studyDescription() {
    return 'no value provided';
  }

  /**
   * Get the series date.
   * @return {*}
   */
  public seriesDate() {
    return 'no value provided';
  }

  /**
   * Get the series desciption.
   * @return {*}
   */
  public seriesDescription() {
    return 'no value provided';
  }

  /**
   * Get the patient ID.
   * @return {*}
   */
  public patientID() {
    return 'no value provided';
  }

  /**
   * Get the patient name.
   * @return {*}
   */
  public patientName() {
    return 'no value provided';
  }

  /**
   * Get the patient age.
   * @return {*}
   */
  public patientAge() {
    return 'no value provided';
  }

  /**
   * Get the patient birthdate.
   * @return {*}
   */
  public patientBirthdate() {
    return 'no value provided';
  }

  /**
   * Get the patient sex.
   * @return {*}
   */
  public patientSex() {
    return 'no value provided';
  }

  /**
   * Get min/max values in array
   *
   * @param {*} pixelData
   *
   * @return {*}
   */
  // tslint:disable-next-line: no-any
  public minMaxPixelData(pixelData: any = []) {
    const minMax = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    const numPixels = pixelData.length;
    for (let index = 0; index < numPixels; index++) {
      const spv = pixelData[index];
      minMax[0] = Math.min(minMax[0], spv);
      minMax[1] = Math.max(minMax[1], spv);
    }

    return minMax;
  }
}
