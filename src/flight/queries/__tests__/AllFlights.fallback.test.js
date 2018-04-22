// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import PrgMexDataset from '../../datasets/prg-mex.json';
import NoFlightsDataset from '../../datasets/no-results.json';
import PrgFraMexDataset from '../../datasets/prg,fra-mex.json';
import PragueDataset from '../../../location/datasets/prague.json';
import FrankfurtDataset from '../../../location/datasets/frankfurt.json';
import MexicoDataset from '../../../location/datasets/mexico.json';

beforeEach(() => {
  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'Prague',
      to: 'Mexico',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(NoFlightsDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'prague_cz',
      to: 'MEX',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(PrgMexDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'Prague,Frankfurt',
      to: 'Mexico',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(NoFlightsDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'prague_cz,frankfurt_de',
      to: 'MEX',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(PrgFraMexDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'Prague' }),
  ).replyWithData(PragueDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'Frankfurt' }),
  ).replyWithData(FrankfurtDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'Mexico' }),
  ).replyWithData(MexicoDataset);

  [
    'PRG',
    'MXP',
    'BRU',
    'CUN',
    'MEX',
    'FRA',
    'LIN',
    'LHR',
    'OSL',
    'MCO',
    'IAH',
    'ARN',
    'PRG',
    'LAX',
  ].forEach(iata => {
    RestApiMock.onGet(
      config.restApiEndpoint.allLocations({
        term: iata,
        locale: 'en-US',
      }),
    ).replyWithData({
      locations: [
        {
          id: 'MOCKED',
          city: {
            name: 'Mocked City Name',
          },
        },
      ],
    });
  });
});

describe('all flights location fallback', () => {
  it('should return legs data by using locations fallback', async () => {
    const allFlightsSearchQuery = `
    query ($input: FlightsSearchInput!) {
      allFlights(search: $input) {
        edges {
          node {
            legs {
              id
              departure { airport { city { name } } }
              arrival { airport { city { name } } }
            }
          }
        }
      }
    }`;
    const variables = {
      input: {
        // From and To defined as a name, not code or id
        from: {
          location: 'Prague',
        },
        to: {
          location: 'Mexico',
        },
        date: {
          from: '2017-08-08',
          to: '2017-09-08',
        },
      },
    };
    expect(await graphql(allFlightsSearchQuery, variables)).toMatchSnapshot();
  });

  it('should return legs data by using locations fallback with multiple locations', async () => {
    const allFlightsSearchQuery = `
    query ($input: FlightsSearchInput!) {
      allFlights(search: $input) {
        edges {
          node {
            legs {
              id
              departure { airport { city { name } } }
              arrival { airport { city { name } } }
            }
          }
        }
      }
    }`;
    const variables = {
      input: {
        // From and To defined as a name, not code or id
        from: [{ location: 'Prague' }, { location: 'Frankfurt' }],
        to: {
          location: 'Mexico',
        },
        date: {
          from: '2017-08-08',
          to: '2017-09-08',
        },
      },
    };
    expect(await graphql(allFlightsSearchQuery, variables)).toMatchSnapshot();
  });
});
