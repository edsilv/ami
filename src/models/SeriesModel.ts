import BaseModel from './BaseModel';

/**
 * Series object.
 *
 * @module models/series
 */
export default class SeriesModel extends BaseModel {
  private _concatenationUID: number;
  private _seriesInstanceUID: number;
  private _transferSyntaxUID: string;
  private _seriesNumber: number;
  private _seriesDescription: string;
  private _seriesDate: string;
  private _studyDescription: string;
  private _studyDate: string;
  private _accessionNumber: number;
  private _modality: string;
  private _dimensionIndexSequence: any[];
  private _numberOfFrames: number;
  private _numberOfChannels: number;
  private _patientID: string;
  private _patientName: string;
  private _patientAge: string;
  private _patientBirthdate: string;
  private _patientSex: string;
  private _segmentationType: any;
  private _segmentationSegments: any[];
  private _stack: any[];
  /**
   * Models series constructor
   */
  constructor() {
    super();

    this._concatenationUID = -1;
    this._seriesInstanceUID = -1;
    this._transferSyntaxUID = '';
    this._seriesNumber = -1;
    this._seriesDescription = '';
    this._seriesDate = '';
    this._studyDescription = '';
    this._studyDate = '';
    this._accessionNumber = -1;
    this._modality = 'Modality not set';
    this._dimensionIndexSequence = [];
    // it is used in the loader in case a dicom/nifti contains multiple frames
    // should be updated after merge or renamed
    this._numberOfFrames = 0;
    this._numberOfChannels = 1;

    // patient information
    this._patientID = '';
    this._patientName = '';
    this._patientAge = '';
    this._patientBirthdate = '';
    this._patientSex = '';

    // SEGMENTATION STUFF
    this._segmentationType = null;
    this._segmentationSegments = [];

    // STACK
    this._stack = [];
  }

  /**
   * Validate a series.
   *
   * Requirements:
   *   - mergeSeries method
   *   - _seriesInstanceUID
   *   - _numberOfFrames
   *   - _numberOfChannels
   *   _ _stack
   *
   * @param {SeriesModel} model - Model to be validated as series.
   *
   * @return {boolean} True if series is valid. False if not.
   *
   * @override
   */
  public validate(model: any) {
    if (
      !(
        super.validate(model) &&
        typeof model.mergeSeries === 'function' &&
        model.hasOwnProperty('_seriesInstanceUID') &&
        model.hasOwnProperty('_numberOfFrames') &&
        model.hasOwnProperty('_numberOfChannels') &&
        model.hasOwnProperty('_stack') &&
        typeof model._stack !== 'undefined' &&
        Array === model._stack.constructor
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Merge current series with provided series.
   * 2 series can ONLY be merge if they have the same SeriesInstanceUID.
   *
   * Also merges the stacks inside a series.
   *
   * @param {SeriesModel} series - Series to be merged against current series.
   *
   * @return {boolean} True if series could be merge. False if not.
   *
   * @override
   */
  public merge(series: any) {
    if (!this.validate(series)) {
      return false;
    }

    if (this._seriesInstanceUID === series.seriesInstanceUID) {
      // may merge incorrectly if loader will return more than one stacks per series
      if (series.stack[0]) {
        if (this._stack[0]._numberOfFrames === 0) {
          this._stack[0].computeNumberOfFrames();
        }
        this._stack[0].computeCosines();
        if (series.stack[0]._numberOfFrames === 0) {
          series.stack[0].computeNumberOfFrames();
        }
        series.stack[0].computeCosines();
      }
      return this.mergeModels(this._stack, series.stack);
    } else {
      return false;
    }
  }

  /**
   * Merge current series with provided array of series.
   * 2 series can ONLY be merge if they have the same SeriesInstanceUID.
   *
   * Also merges the stacks inside a series.
   *
   * @param {Array.<SeriesModel>} target - Series to be merged against current series.
   *
   * @return {Array.<SeriesModel>} Array of series properly merged.
   */
  public mergeSeries(target: any) {
    const seriesContainer = [this];
    this.mergeModels(seriesContainer, target);
    return seriesContainer;
  }

  /**
   * Series instance UID setter
   *
   * @param {*} seriesInstanceUID
   */
  set seriesInstanceUID(seriesInstanceUID: any) {
    this._seriesInstanceUID = seriesInstanceUID;
  }

  /**
   * Series instace UID getter
   *
   * @return {*}
   */
  get seriesInstanceUID() {
    return this._seriesInstanceUID;
  }

  /**
   * Transfer syntax UID setter
   *
   * @param {*} transferSyntaxUID
   */
  set transferSyntaxUID(transferSyntaxUID: any) {
    this._transferSyntaxUID = transferSyntaxUID;
  }

  /**
   * Transfer syntax UID getter
   *
   * @return {*}
   */
  get transferSyntaxUID() {
    return this._transferSyntaxUID;
  }

  /**
   * Transfer syntax UID getter
   *
   * @return {*}
   */
  get transferSyntaxUIDLabel() {
    switch (this._transferSyntaxUID) {
      case '1.2.840.10008.1.2.4.90':
        return 'JPEG 2000 Lossless';
      case '1.2.840.10008.1.2.4.91':
        return 'JPEG 2000 Lossy';
      case '1.2.840.10008.1.2.4.57':
        return 'JPEG Lossless, Nonhierarchical (Processes 14)';
      case '1.2.840.10008.1.2.4.70':
        return 'JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])';
      case '1.2.840.10008.1.2.4.50':
        return 'JPEG Baseline lossy process 1 (8 bit)';
      case '1.2.840.10008.1.2.4.51':
        return 'JPEG Baseline lossy process 2 & 4 (12 bit)';
      case '1.2.840.10008.1.2':
        return 'Implicit VR Little Endian';
      case '1.2.840.10008.1.2.1':
        return 'Explicit VR Little Endian';
      case '1.2.840.10008.1.2.2':
        return 'Explicit VR Big Endian';
      default:
        return `Unknown transfersyntax: ${this._transferSyntaxUID}`;
    }
  }

  /**
   * Study date setter
   *
   * @param {*} studyDate
   */
  set studyDate(studyDate: any) {
    this._studyDate = studyDate;
  }

  /**
   * Study date getter
   *
   * @return {*}
   */
  get studyDate() {
    return this._studyDate;
  }

  /**
   * Study descripition setter
   *
   * @param {*} studyDescription
   */
  set studyDescription(studyDescription: any) {
    this._studyDescription = studyDescription;
  }

  /**
   * Study description getter
   *
   * @return {*}
   */
  get studyDescription() {
    return this._studyDescription;
  }

  /**
   * Series date setter
   *
   * @param {*} seriesDate
   */
  set seriesDate(seriesDate: any) {
    this._seriesDate = seriesDate;
  }

  /**
   * Series date getter
   *
   * @return {*}
   */
  get seriesDate() {
    return this._seriesDate;
  }

  /**
   * Series descripition setter
   *
   * @param {*} seriesDescription
   */
  set seriesDescription(seriesDescription: any) {
    this._seriesDescription = seriesDescription;
  }

  /**
   * Series description getter
   *
   * @return {*}
   */
  get seriesDescription() {
    return this._seriesDescription;
  }

  /**
   * Patient ID setter
   *
   * @param {*} patientID
   */
  set patientID(patientID: any) {
    this._patientID = patientID;
  }

  /**
   * Patient ID getter
   *
   * @return {*}
   */
  get patientID() {
    return this._patientID;
  }

  /**
   * Patient name setter
   *
   * @param {*} patientName
   */
  set patientName(patientName: any) {
    this._patientName = patientName;
  }

  /**
   * Patient name getter
   *
   * @return {*}
   */
  get patientName() {
    return this._patientName;
  }

  /**
   * Patient age setter
   *
   * @param {*} patientAge
   */
  set patientAge(patientAge: any) {
    this._patientAge = patientAge;
  }

  /**
   * Patient age getter
   *
   * @return {*}
   */
  get patientAge() {
    return this._patientAge;
  }

  /**
   * Patient birthdate setter
   *
   * @param {*} patientBirthdate
   */
  set patientBirthdate(patientBirthdate: any) {
    this._patientBirthdate = patientBirthdate;
  }

  /**
   * Patient birthdate getter
   *
   * @return {*}
   */
  get patientBirthdate() {
    return this._patientBirthdate;
  }

  /**
   * Patient sex setter
   *
   * @param {*} patientSex
   */
  set patientSex(patientSex: any) {
    this._patientSex = patientSex;
  }

  /**
   * Patient sex getter
   *
   * @return {*}
   */
  get patientSex() {
    return this._patientSex;
  }

  /**
   * Number of frames setter
   *
   * @param {*} numberOfFrames
   */
  set numberOfFrames(numberOfFrames: any) {
    this._numberOfFrames = numberOfFrames;
  }

  /**
   * Number of frames getter
   *
   * @return {*}
   */
  get numberOfFrames() {
    return this._numberOfFrames;
  }

  /**
   * Number of channels setter
   *
   * @param {*} numberOfChannels
   */
  set numberOfChannels(numberOfChannels: any) {
    this._numberOfChannels = numberOfChannels;
  }

  /**
   * Number of channels getter
   *
   * @return {*}
   */
  get numberOfChannels() {
    return this._numberOfChannels;
  }

  /**
   * Stack setter
   *
   * @param {*} stack
   */
  set stack(stack: any) {
    this._stack = stack;
  }

  /**
   * Stack getter
   *
   * @return {*}
   */
  get stack() {
    return this._stack;
  }

  /**
   * Modality setter
   *
   * @param {*} modality
   */
  set modality(modality: any) {
    this._modality = modality;
  }

  /**
   * Modality getter
   *
   * @return {*}
   */
  get modality() {
    return this._modality;
  }

  /**
   * Segmentation type setter
   *
   * @param {*} segmentationType
   */
  set segmentationType(segmentationType: any) {
    this._segmentationType = segmentationType;
  }

  /**
   * Segmentation type getter
   *
   * @return {*}
   */
  get segmentationType() {
    return this._segmentationType;
  }

  /**
   * Segmentation segments setter
   *
   * @param {*} segmentationSegments
   */
  set segmentationSegments(segmentationSegments: any) {
    this._segmentationSegments = segmentationSegments;
  }

  /**
   * Segmentation segments getter
   *
   * @return {*}
   */
  get segmentationSegments() {
    return this._segmentationSegments;
  }
}
