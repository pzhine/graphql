// @flow

import { GraphQLInputObjectType } from 'graphql';
import Currency from '../../../common/types/enums/Currency';

export default new GraphQLInputObjectType({
  name: 'AvailableHotelOptionsInput',
  fields: {
    currency: {
      type: Currency,
      description: 'Three-letters ISO 4217 currency code, e.g. EUR or USD',
    },
  },
});
