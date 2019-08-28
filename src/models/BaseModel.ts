/**
 * Base object.
 *
 * @module models/base
 */

export default class BaseModel {
  protected _id: number;

  constructor() {
    this._id = -1;
  }
  /**
   * Merge 2 arrays of models.
   * Merge the target array into the reference array.
   *
   * @param {Array.<Models>} referenceArray - Array to be merge against
   * @param {Array.<Models>} targetArray - Array to be merged against reference.
   *
   * @return {boolean} True if merge was sucessful. False if something went wrong.
   */
  public mergeModels(referenceArray: any, targetArray: any) {
    if (!(this._validateModelArray(referenceArray) && this._validateModelArray(targetArray))) {
      window.console.log('invalid inputs provided.');
      return false;
    }

    for (let i = 0, targetLength = targetArray.length; i < targetLength; i++) {
      // test targetArray against existing targetArray
      for (let j = 0, refLength = referenceArray.length; j < refLength; j++) {
        if (referenceArray[j].merge(targetArray[i])) {
          // merged successfully
          break;
        } else if (j === referenceArray.length - 1) {
          // last merge was not successful
          // this is a new targetArray
          referenceArray.push(targetArray[i]);
        }
      }
    }

    return true;
  }

  /**
   * Merge model against current model.
   */
  public merge(model: any) {
    // make sure model is valid
    if (!this.validate(model)) {
      return false;
    }

    // they can be merged if they match
    if (this._id === model._id) {
      return true;
    }
    return false;
  }

  /**
   * Validate a model.
   *
   * @return {boolean} True if model is valid. False if not.
   */
  public validate(model: any) {
    if (!(model && model !== null && typeof model.merge === 'function')) {
      return false;
    }

    return true;
  }

  /**
   * Validate array of models.
   *
   * @param {Array.<Models>} modelArray - Array containing models.
   *
   * @return {boolean} True if array is valid. False if not.
   */
  public _validateModelArray(modelArray: any) {
    if (!(modelArray !== null && Array === modelArray.constructor)) {
      window.console.log('invalid model array provided.');
      return false;
    }

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < modelArray.length; i++) {
      if (
        !(
          modelArray[i] &&
          modelArray[i] !== null &&
          typeof modelArray[i].validate === 'function' &&
          modelArray[i].validate(modelArray[i])
        )
      ) {
        return false;
      }
    }

    return true;
  }
}
