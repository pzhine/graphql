// @flow

import { GraphQLObjectType, GraphQLString } from 'graphql';
import { globalIdField } from '../../../common/services/OpaqueIdentifier';

import type { HotelPhotoType } from '../../dataloaders/SingleHotel';

export default new GraphQLObjectType({
  name: 'HotelPhoto',
  fields: {
    id: globalIdField('hotelPhoto', ({ id }: HotelPhotoType) => id),

    lowResUrl: {
      type: GraphQLString,
      resolve: ({ lowResolution }: HotelPhotoType) => lowResolution,
    },

    highResUrl: {
      type: GraphQLString,
      resolve: ({ highResolution }: HotelPhotoType) => highResolution,
    },
  },
});