import BaseModel from "./BaseModel";

/**
 * @module models/voxel
 */

export default class VoxelModel extends BaseModel {
  constructor() {
    super();

    this._id = -1;
    this.worldCoordinates = null;
    this.dataCoordinates = null;
    this.screenCoordinates = null;
    this.value = null;
  }

  set worldCoordinates(worldCoordinates: any) {
    this.worldCoordinates = worldCoordinates;
  }

  get worldCoordinates() {
    return this.worldCoordinates;
  }

  set dataCoordinates(dataCoordinates: any) {
    this.dataCoordinates = dataCoordinates;
  }

  get dataCoordinates() {
    return this.dataCoordinates;
  }

  set screenCoordinates(screenCoordinates: any) {
    this.screenCoordinates = screenCoordinates;
  }

  get screenCoordinates() {
    return this.screenCoordinates;
  }

  set value(value: any) {
    this.value = value;
  }

  get value() {
    return this.value;
  }

  set _id(_id: any) {
    this._id = _id;
  }

  get _id() {
    return this._id;
  }
}
