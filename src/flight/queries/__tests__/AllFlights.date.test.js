// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import PrgMexDataset from '../../datasets/prg-mex.json';

beforeEach(() => {
  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'PRG',
      to: 'MEX',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(PrgMexDataset);

  ['PRG', 'MEX', 'OSL', 'MCO', 'IAH', 'ARN', 'LAX'].forEach(iata => {
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

let allFlightsSearchQuery;
beforeEach(() => {
  allFlightsSearchQuery = `
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
});

describe('all flights dates', () => {
  it('should throw error with invalid date range', async () => {
    const variables = {
      input: {
        from: [
          {
            location: 'PRG',
          },
        ],
        to: {
          location: 'MEX',
        },
        date: {
          from: '2017-08-08',
        },
      },
    };
    expect(await graphql(allFlightsSearchQuery, variables)).toMatchSnapshot();
  });

  it('should return response', async () => {
    const variables = {
      input: {
        from: [
          {
            location: 'PRG',
          },
        ],
        to: {
          location: 'MEX',
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
