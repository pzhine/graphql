// @flow

import url from 'url';

export default {
  restApiEndpoint: {
    allBookings:
      'https://booking-api.skypicker.com/api/v0.1/users/self/bookings',
    singleBooking: (bookingId: number, simpleToken: string) =>
      queryWithParameters(
        `https://booking-api.skypicker.com/api/v0.1/users/self/bookings/${bookingId}`,
        {
          simple_token: simpleToken,
        },
      ),
    allFlights: (queryParameters: ?Object = null) =>
      queryWithParameters('https://api.skypicker.com/flights', {
        ...queryParameters,
        v: 3,
      }),
    login: 'https://auth.skypicker.com/v1/user.login',
    identity: 'https://auth.skypicker.com/v1/user.get',
    airlines: 'https://api.skypicker.com/airlines?v=2',
    allLocations: (queryParameters: Object) =>
      queryWithParameters(
        'https://api.skypicker.com/locations',
        queryParameters,
      ),
    rates: 'https://api.skypicker.com/rates',
    allFAQ: (search: string) =>
      queryWithParameters(
        'https://api.skypicker.com/knowledgebase/api/v1/search',
        { q: search, autocomplete: true },
      ),
    allFAQCategories: (faqCategoryId: ?number) => {
      const categoryId = faqCategoryId ? `/${faqCategoryId}` : '';

      return `https://api.skypicker.com/knowledgebase/api/v1/categories${categoryId}`;
    },
    FAQArticle: (faqArticleId: string) => {
      return `https://api.skypicker.com/knowledgebase/api/v1/articles/${faqArticleId}`;
    },
    FAQArticleVote: (faqArticleId: string) =>
      `https://api.skypicker.com/knowledgebase/api/v1/articles/${faqArticleId}/vote`,
  },
  auth: {
    basicToken: String(process.env.AUTH_BASIC_TOKEN),
    digest: String(process.env.AUTH_DIGEST),
  },
};

export function queryWithParameters(
  absoluteUrl: string,
  queryParameters: ?Object = null,
) {
  const urlObject = url.parse(absoluteUrl, true);
  // intentional ==, can be null or undefined
  if (queryParameters != null) {
    urlObject.query = filterParameters(queryParameters);
  }
  return url.format(urlObject);
}

function filterParameters(parameters: Object) {
  const filteredParameters = parameters;
  Object.keys(parameters).forEach(key => {
    const val = parameters[key];
    if (val === null || val === undefined || val === '') {
      delete filteredParameters[key];
      return;
    }

    if (Array.isArray(val)) {
      filteredParameters[key] = val.toString();
    }

    if (typeof val === 'string') {
      filteredParameters[key] = val.trim();
    }
  });
  return filteredParameters;
}
