// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import Booking from '../Booking';
import AllBookingsDataset from '../../datasets/AllBookings.json';

beforeEach(() => {
  RestApiMock.onGet(config.restApiEndpoint.allBookings).replyWithData(
    AllBookingsDataset,
  );

  ['CDG', 'LGW'].forEach(iata => {
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

describe('single booking query', () => {
  it('should be of Booking type', () => {
    expect(Booking.type.toString()).toBe('Booking');
  });

  it('should return valid fields', async () => {
    const arrivalQuery = `{
      booking(id: 2707251) {
        arrival {
          airport { city { name }, locationId }
        }
        departure {
          airport { city { name }, locationId }
        }
        legs {
          arrival {
            airport { city { name }, locationId }
          }
          departure {
            airport { city { name }, locationId }
          }
        }
      }
    }`;
    expect(await graphql(arrivalQuery)).toMatchSnapshot();
  });

  it('should work with opaque Booking id', async () => {
    const query = `{
      booking(id: "Qm9va2luZzoyNzA3MjUx") {
        id
        databaseId
      }
    }`;
    expect(await graphql(query)).toMatchSnapshot();
  });
});
