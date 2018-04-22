// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import AllFlights from '../AllFlights';
import AirlinesDataset from '../../datasets/airlines.json';
import FlightDataset from '../../datasets/prg-mex.json';

beforeEach(() => {
  RestApiMock.onGet(config.restApiEndpoint.airlines).replyWithData(
    AirlinesDataset,
  );

  RestApiMock.onGet(
    config.restApiEndpoint.allFlights({
      flyFrom: 'PRG',
      to: 'MEX',
      dateFrom: '08/08/2017',
      dateTo: '08/09/2017',
    }),
  ).replyWithData(FlightDataset);

  ['MEX', 'PRG'].forEach(iata => {
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

describe('all flights query', () => {
  it('should be non-null list of non-null Flight types', () => {
    expect(AllFlights.type.toString()).toBe('FlightConnection');
  });

  it('should return array of flights', async () => {
    const allFlightsSearchQuery = `
    fragment Location on RouteStop {
      airport {
        locationId
        city {
          name
        }
      }
      time
      localTime
    }

    query ($input: FlightsSearchInput!) {
      allFlights(search: $input) {
        edges {
          node {
            id
            arrival {
              ...Location
            }
            departure {
              ...Location
            }
            airlines {
              name
              code
              logoUrl
              isLowCost
            }
            duration
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
    };
    expect(await graphql(allFlightsSearchQuery, variables)).toMatchSnapshot();
  });

  it('should return error if invalid date format is passed', async () => {
    const allFlightsSearchQuery = `
    query ($input: FlightsSearchInput!) {
      allFlights(search: $input) {
        edges {
          node {
            arrival {
              time
            }
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
          from: '08/08/2017',
          to: '2017-09-08',
        },
      },
    };
    expect(await graphql(allFlightsSearchQuery, variables)).toMatchSnapshot();
  });

  it('should return error if dateFrom is after dateTo', async () => {
    const allFlightsSearchQuery = `
    query ($input: FlightsSearchInput!) {
      allFlights(search: $input) {
        edges {
          node {
            arrival {
              time
            }
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
          from: '2018-08-08', // 2018!
          to: '2017-09-08',
        },
      },
    };
    expect(await graphql(allFlightsSearchQuery, variables)).toMatchSnapshot();
  });
});
