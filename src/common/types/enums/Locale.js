// @flow

import { GraphQLEnumType } from 'graphql';
import LocaleValues from './LocaleValues';

export default new GraphQLEnumType({
  name: 'Locale',
  values: LocaleValues,
  description:
    'DEPRECATED - use "Accept-Language" HTTP header to specify locale.' +
    'Language tag in the format of the RFC 5646.',
});
