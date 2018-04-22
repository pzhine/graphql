// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import PrgMexDataset from '../../datasets/prg-mex.json';
import PragueDataset from '../../../location/datasets/prague.json';
import MexicoDataset from '../../../location/datasets/mexico.json';

beforeEach(() => {
  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'PRG',
      to: 'MEX',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
      maxStopovers: 0,
    }),
  ).replyWithData(PrgMexDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'PRG', locale: 'en-US' }),
  ).replyWithData(PragueDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'MEX', locale: 'en-US' }),
  ).replyWithData(MexicoDataset);
});

describe('all flights filters', () => {
  it('should return direct flights', async () => {
    const query = `
    query ($input: FlightsSearchInput!, $filters: FlightsFiltersInput) {
      allFlights(search: $input, filters: $filters) {
        edges {
          node {
            departure { airport { city { name }}}
            arrival { airport { city { name }}}
          }
        }
      }
    }`;
    const variables = {
      input: {
        from: {
          location: 'PRG',
        },
        to: {
          location: 'MEX',
        },
        date: {
          from: '2017-08-08',
          to: '2017-09-08',
        },
      },
      filters: {
        maxStopovers: 0,
      },
    };
    expect(await graphql(query, variables)).toMatchSnapshot();
  });
});
