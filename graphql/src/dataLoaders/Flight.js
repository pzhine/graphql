// @flow

import DataLoader from 'dataloader';
import dateFns from 'date-fns';
import _ from 'lodash';

import { get } from '../services/HttpRequest';
import config from '../../config/application';
import LocationDataLoader from '../dataLoaders/Location';
import LocaleMap from '../enums/LocaleMap';

import type { Flight } from '../types/Flight';
import type { LocationVariants, RadiusLocation } from '../types/Location';

type Duration = {|
  maxFlightDuration: null | number,
  stopovers: null | { from: ?number, to: ?number },
|};

type Filters = {|
  maxStopovers: null | number,
  duration: null | Duration,
|};

type QueryParameters = {|
  from: Array<LocationVariants>,
  to: Array<LocationVariants>,
  dateFrom: Date,
  dateTo: Date,
  returnFrom: null | Date,
  returnTo: null | Date,
  typeFlight: 'return' | 'oneway',
  currency: null | string,
  adults: null | number,
  locale: null | string,
  filters: null | Filters,
|};

type BackendAPIResponse = {|
  currency: string,
  data: Flight[],
|};

export default class FlightDataloader {
  flightDataLoader: DataLoader<QueryParameters, BackendAPIResponse>;
  locationDataLoader: LocationDataLoader;

  constructor(locationDataLoader: LocationDataLoader) {
    this.flightDataLoader = new DataLoader(
      (searchParameters: QueryParameters[]) => {
        return this.batchGetLocations(searchParameters);
      },
      {
        cacheKeyFn: key => {
          return JSON.stringify(key);
        },
      },
    );
    this.locationDataLoader = locationDataLoader;
  }

  async load(searchParameters: QueryParameters): Promise<BackendAPIResponse> {
    return this.flightDataLoader.load(searchParameters);
  }

  async loadMany(
    searchParameters: QueryParameters[],
  ): Promise<BackendAPIResponse[]> {
    return this.flightDataLoader.loadMany(searchParameters);
  }

  async batchGetLocations(
    searchParameters: QueryParameters[],
  ): Promise<Array<BackendAPIResponse | Error>> {
    return await Promise.all(
      searchParameters.map(searchParameters =>
        this._fetchFlights(searchParameters),
      ),
    );
  }

  async _fetchFlights(searchParameters: QueryParameters) {
    const {
      from,
      to,
      dateFrom,
      dateTo,
      returnFrom,
      returnTo,
      typeFlight,
      currency,
      adults,
      locale,
      filters,
    } = searchParameters;
    // see: https://github.com/tc39/proposal-object-rest-spread/issues/45
    const parameters = {
      flyFrom: this._normalizeLocations(from),
      to: this._normalizeLocations(to),
      dateFrom: dateFns.format(dateFrom, 'DD/MM/YYYY'),
      dateTo: dateFns.format(dateTo, 'DD/MM/YYYY'),
      ...(returnFrom && {
        returnFrom: dateFns.format(returnFrom, 'DD/MM/YYYY'),
      }),
      ...(returnTo && {
        returnTo: dateFns.format(returnTo, 'DD/MM/YYYY'),
      }),
      ...(typeFlight && {
        typeFlight: typeFlight,
      }),
    };
    if (currency !== null) {
      parameters.curr = currency;
    }
    if (adults !== null) {
      parameters.adults = adults;
    }
    if (locale !== null) {
      parameters.locale = LocaleMap[locale];
    }
    if (filters) {
      if (filters.maxStopovers !== null) {
        parameters.maxStopovers = filters.maxStopovers;
      }
      if (filters.duration) {
        const duration = filters.duration;
        if (duration.maxFlightDuration !== null) {
          parameters.maxFlyDuration = duration.maxFlightDuration;
        }
        if (duration.stopovers && duration.stopovers.from !== null) {
          parameters.stopoverfrom = duration.stopovers.from;
        }
        if (duration.stopovers && duration.stopovers.to !== null) {
          parameters.stopoverto = duration.stopovers.to;
        }
      }
    }

    const firstTry = await get(config.restApiEndpoint.allFlights(parameters));
    if (firstTry.data.length > 0) {
      return firstTry;
    }

    const [flyFrom, flyTo] = await Promise.all([
      this._normalizeLocationsUsingRefetch(from, locale),
      this._normalizeLocationsUsingRefetch(to, locale),
    ]);
    parameters.flyFrom = flyFrom;
    parameters.to = flyTo;
    return get(config.restApiEndpoint.allFlights(parameters));
  }

  _normalizeLocations(locations: LocationVariants[]): string[] {
    return locations.map(location => {
      if (location.location !== undefined) {
        return location.location;
      } else {
        return this._stringifyRadius(location);
      }
    });
  }

  async _normalizeLocationsUsingRefetch(
    locations: LocationVariants[],
    locale: null | string,
  ) {
    const options = locale !== null ? { locale } : {};
    const normalizedLocations = locations.map(location => {
      if (location.location === undefined) {
        return Promise.resolve(this._stringifyRadius(location));
      }
      // adjust exact location using backend location API
      return this.locationDataLoader
        .load(location.location, options)
        .then(newLocation => newLocation.locationId); // eslint-disable-line promise/prefer-await-to-then
    });
    return Promise.all(normalizedLocations);
  }

  _stringifyRadius({ radius }: RadiusLocation): string {
    const lat = _.round(radius.lat, 2);
    const lng = _.round(radius.lng, 2);
    const distance = _.round(radius.radius, 0);
    return `${lat}-${lng}-${distance}km`;
  }
}
