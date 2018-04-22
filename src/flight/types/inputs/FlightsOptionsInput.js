// @flow

import { GraphQLInputObjectType } from 'graphql';
import Currency from '../../../common/types/enums/Currency';
import Locale from '../../../common/types/enums/Locale';

export default new GraphQLInputObjectType({
  name: 'FlightsOptionsInput',
  fields: {
    currency: {
      type: Currency,
      description: 'An ISO-4217 currency code.',
    },
    locale: {
      type: Locale,
    },
  },
});
