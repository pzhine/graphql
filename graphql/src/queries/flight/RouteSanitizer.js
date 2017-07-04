// @flow

import _ from 'lodash';
import type { DepartureArrivalType } from '../../Entities';

type propsMap = {
  utc: string,
  local: string,
  code: string,
  cityName: string,
};

export function sanitizeRoute(
  data: Object,
  propsMap: propsMap,
): DepartureArrivalType {
  const utc = _.get(data, propsMap.utc);
  const local = _.get(data, propsMap.local);
  return {
    when:
      utc && local
        ? {
            utc: new Date(utc * 1000),
            local: new Date(local * 1000),
          }
        : null,
    where: {
      code: _.get(data, propsMap.code),
      cityName: _.get(data, propsMap.cityName),
    },
  };
}
