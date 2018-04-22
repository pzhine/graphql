// @flow

import DataLoader from 'dataloader';
import stringify from 'json-stable-stringify';

import LocationSuggestions from './LocationSuggestions';
import { batchGetLocations, processResponse } from './Fetcher';

import type { Location, Options } from '../Location';

export default class LocationDataLoader {
  locationSuggestionsDataLoader: LocationSuggestions;
  dataLoader: DataLoader<Object, Location[]>;

  constructor(dataloader: LocationSuggestions) {
    this.locationSuggestionsDataLoader = dataloader;
    this.dataLoader = new DataLoader(
      (urlParameters: $ReadOnlyArray<Object>) => {
        return batchGetLocations(urlParameters);
      },
      {
        cacheKeyFn: key => stringify(key),
      },
    );
  }

  /**
   * Returns single location suggestion based on single location key.
   */
  async load(locationKey: string, options: ?Options): Promise<Location> {
    const possibleValues = await this.locationSuggestionsDataLoader.loadByKey(
      locationKey,
      options,
    );
    return processResponse(possibleValues)[0];
  }

  /**
   * Returns single location suggestion for each location key.
   */
  async loadMany(locationKeys: string[]): Promise<Location[]> {
    const allLocations = await this.locationSuggestionsDataLoader.loadMany(
      locationKeys,
    );
    return allLocations.map(
      possibleLocations => processResponse(possibleLocations)[0],
    );
  }

  async loadById(id: string, locale?: string): Promise<Location> {
    const locations = await this.dataLoader.load({
      type: 'id',
      id,
      locale: typeof locale === 'string' ? locale.replace('_', '-') : locale,
    });
    return processResponse(locations)[0];
  }

  async loadBySlug(slug: string): Promise<Location> {
    try {
      const locations = await this.dataLoader.load({
        type: 'slug',
        term: slug,
      });
      return processResponse(locations)[0];
    } catch (e) {
      throw new Error(`Location not found. Slug: ${slug}`);
    }
  }
}
