// @flow

import DataLoader from 'dataloader';
import stringify from 'json-stable-stringify';

import { batchGetLocations, processResponse } from './Fetcher';

import type { Radius, Rectangle, Location, Options } from '../Location';

export default class LocationSuggestionsDataloader {
  dataLoader: DataLoader<Object, Location[]>;

  constructor() {
    this.dataLoader = new DataLoader(
      (urlParameters: $ReadOnlyArray<Object>) => {
        return batchGetLocations(urlParameters);
      },
      {
        cacheKeyFn: key => stringify(key),
      },
    );
  }

  async load(options: ?Options): Promise<Location[]> {
    const locations = await this.dataLoader.load({
      type: 'dump',
      limit: 9999,
      ...sanitizeOptions(options),
    });
    return processResponse(locations);
  }

  /**
   * Returns single set of multiple suggestions for single location key.
   * If you need to load only one (the first) location for location key
   * you have to use 'LocationDataLoader.load' function.
   */
  async loadByKey(locationKey: string, options: ?Options): Promise<Location[]> {
    const locations = await this.dataLoader.load({
      term: locationKey,
      ...sanitizeOptions(options),
    });
    return processResponse(locations);
  }

  async loadByRadius(radius: Radius, options: ?Options): Promise<Location[]> {
    const locations = await this.dataLoader.load({
      type: 'radius',
      lat: radius.lat,
      lon: radius.lng,
      radius: radius.radius,
      ...sanitizeOptions(options),
    });
    return processResponse(locations);
  }

  async loadByArea(area: Rectangle, options: ?Options): Promise<Location[]> {
    const locations = await this.dataLoader.load({
      type: 'box',
      high_lat: area.topLeft.lat,
      low_lon: area.topLeft.lng,
      low_lat: area.bottomRight.lat,
      high_lon: area.bottomRight.lng,
      ...sanitizeOptions(options),
    });
    return processResponse(locations);
  }

  async loadSubLocations(term: String, options: ?Options): Promise<Location[]> {
    const locations = await this.dataLoader.load({
      type: 'subentity',
      term,
      ...sanitizeOptions(options),
    });
    return processResponse(locations);
  }

  /**
   * Returns set of suggestions for multiple places (array of arrays of
   * possible locations related to the keys).
   */
  async loadMany(
    locationKeys: string[],
    options: ?Options,
  ): Promise<Array<Location[]>> {
    const locations = await this.dataLoader.loadMany(
      locationKeys.map(location => ({
        term: location,
        ...sanitizeOptions(options),
      })),
    );
    return locations.map(l => processResponse(l));
  }
}

export function sanitizeOptions(options: ?Options): Object {
  if (!options) return {};
  return {
    locale:
      typeof options.locale === 'string'
        ? options.locale.replace('_', '-')
        : options.locale,
    location_types: options.locationType,
  };
}
