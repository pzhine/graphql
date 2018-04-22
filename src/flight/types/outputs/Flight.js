// @flow

import _ from 'lodash';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import type { GraphQLResolveInfo } from 'graphql';

import { globalIdField } from '../../../common/services/OpaqueIdentifier';
import GraphQLRouteStop from './RouteStop';
import GraphQLLeg from './Leg';
import GraphQLAirline from './Airline';
import GraphQLPrice from '../../../common/types/outputs/Price';
import FlightDurationInMinutes from '../../resolvers/FlightDuration';
import { buildBookingUrl } from '../../dataloaders/BookingUrlBuilder';

import type { GraphqlContextType } from '../../../common/services/GraphqlContext';
import type { Price } from '../../../common/types/Price';
import type { DepartureArrival, Flight, Leg, Airline } from '../../Flight';

export default new GraphQLObjectType({
  name: 'Flight',
  fields: {
    id: globalIdField(),

    airlines: {
      type: new GraphQLList(GraphQLAirline),
      description: 'List of all Airlines involved.',
      resolve: async (
        { airlines }: Flight,
        args: Object,
        { dataLoader }: GraphqlContextType,
      ): Promise<Array<?Airline>> =>
        _.uniq(airlines).map(airlineCode =>
          dataLoader.airline.load(airlineCode),
        ),
    },

    departure: {
      type: GraphQLRouteStop,
      resolve: ({ departure }: Flight): DepartureArrival => departure,
    },

    arrival: {
      type: GraphQLRouteStop,
      resolve: ({ arrival }: Flight): DepartureArrival => arrival,
    },

    duration: {
      type: GraphQLInt,
      description: 'Flight duration in minutes.',
      resolve: ({ departure, arrival }: Flight): ?number =>
        FlightDurationInMinutes(departure, arrival),
    },

    legs: {
      type: new GraphQLList(GraphQLLeg),
      description: 'Flight segments, e.g. stopover, change of aircraft, etc.',
      resolve: ({ legs }: Flight): Array<Leg> => legs,
    },

    price: {
      type: GraphQLPrice,
      description: 'Total flight price.',
      resolve: ({ price }: Flight): Price => price,
    },

    bookingUrl: {
      type: GraphQLString,
      description: 'URL to the Kiwi.com for booking the flight.',
      resolve: async (
        { passengers, price, bookingToken }: Flight,
        args: Object,
        { dataLoader, options, locale }: GraphqlContextType,
        { path }: GraphQLResolveInfo,
      ): Promise<string> => {
        const queryOptions = options.getOptions(path);
        const oldWayLocale = queryOptions ? queryOptions.locale : null;
        let useLocale = oldWayLocale;

        if (!oldWayLocale) {
          useLocale = locale;
        }

        return await buildBookingUrl(
          passengers,
          price,
          bookingToken,
          useLocale,
          dataLoader.rates,
        );
      },
    },
  },
});
