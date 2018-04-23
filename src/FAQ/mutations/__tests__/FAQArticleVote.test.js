// @flow

import { toGlobalId } from 'graphql-relay';
import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import articleMockData from '../../datasets/FAQArticle-39.json';

const goodId = '39';
const globalId = toGlobalId('FAQArticle', goodId);

beforeEach(() => {
  RestApiMock.onGet(config.restApiEndpoint.FAQArticle(goodId)).replyWithData(
    articleMockData,
  );
});

describe('FAQArticleVote mutation', () => {
  it('should vote UP', async () => {
    RestApiMock.onPost(
      config.restApiEndpoint.FAQArticleVote(goodId),
    ).replyWithData({
      message: 'yummy',
    });
    const voteMutation = `
      mutation {
        FAQArticleVote(id:"${globalId}", vote:"up") {
          id
          upvotes
          downvotes
        }
      }
    `;
    expect(await graphql(voteMutation)).toMatchSnapshot();
  });
  it('should vote DOWN', async () => {
    RestApiMock.onPost(
      config.restApiEndpoint.FAQArticleVote(goodId),
    ).replyWithData({
      message: 'yummy',
    });
    const voteMutation = `
      mutation {
        FAQArticleVote(id:"${globalId}", vote:"down") {
          id
          upvotes
          downvotes
        }
      }
    `;
    expect(await graphql(voteMutation)).toMatchSnapshot();
  });
  it('should return WRONG vote', async () => {
    RestApiMock.onPost(
      config.restApiEndpoint.FAQArticleVote(goodId),
    ).replyWithData({
      message: 'invalid post body',
    });
    const voteMutation = `
      mutation {
        FAQArticleVote(id:"${globalId}", vote:"wrong") {
          id
          upvotes
          downvotes
        }
      }
    `;
    expect(await graphql(voteMutation)).toMatchSnapshot();
  });
});
