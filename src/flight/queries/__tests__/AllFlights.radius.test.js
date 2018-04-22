// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import PragueDataset from '../../../location/datasets/prague.json';
import MexicoDataset from '../../../location/datasets/mexico.json';
import NoFlightsDataset from '../../datasets/no-results.json';
import PrgFraMexDataset from '../../datasets/prg,fra-mex.json';

beforeEach(() => {
  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'Prague' }),
  ).replyWithData(PragueDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allLocations({ term: 'Mexico' }),
  ).replyWithData(MexicoDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'Prague,50.11-8.68-10km',
      to: 'Mexico',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(NoFlightsDataset);

  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'prague_cz,50.11-8.68-10km',
      to: 'MEX',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(PrgFraMexDataset);

  ['PRG', 'MXP', 'BRU', 'CUN', 'MEX', 'FRA', 'LIN', 'LHR'].forEach(iata => {
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

describe('all flights radius', () => {
  it('should return legs data for radius search', async () => {
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
        from: [
          {
            location: 'Prague',
          },
          {
            // Frankfurt
            radius: {
              lat: 50.11,
              lng: 8.68,
              radius: 10,
            },
          },
        ],
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
