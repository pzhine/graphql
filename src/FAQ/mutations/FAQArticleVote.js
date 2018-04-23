// @flow

import { GraphQLNonNull, GraphQLString, GraphQLID } from 'graphql';
import { fromGlobalId } from 'graphql-relay';

import { post } from '../../common/services/HttpRequest';
import config from '../../../config/application';
import type { FAQArticleDetail as FAQArticleType } from '../dataloaders/getFAQArticle';
import FAQArticle from '../types/outputs/FAQArticle';
import { ProxiedError } from '../../common/services/errors/ProxiedError';
import type { GraphqlContextType } from '../../common/services/GraphqlContext';
import LanguageInput from '../../common/types/inputs/LanguageInput';

const successfulResponse = { message: 'yummy' };
export default {
  type: FAQArticle,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'ID of FAQ article to receive vote.',
    },
    language: {
      type: LanguageInput,
      description: 'Language in which the article is returned.',
    },
    vote: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Is the vote positive or negative? ("up"/"down")',
    },
  },
  resolve: async (
    _: mixed,
    { id, language, vote }: Object,
    { dataLoader }: GraphqlContextType,
  ): Promise<FAQArticleType> => {
    if (vote !== 'up' && vote !== 'down') {
      throw new Error("Votes can only be 'up' or 'down'");
    }
    const numberVote = vote === 'up' ? 1 : -1;
    const payload = {
      vote: numberVote,
    };
    const { id: originalId, type } = fromGlobalId(id);

    if (type !== 'FAQArticle') {
      throw new Error(
        `FAQArticle ID mishmash. You cannot query FAQ with ID ` +
          `'${id}' because this ID is not ID of the FAQArticle. ` +
          `Please use opaque ID of the FAQArticle.`,
      );
    }

    const voteUrl = config.restApiEndpoint.FAQArticleVote(originalId);
    const response = await post(voteUrl, payload);

    if (response.message !== successfulResponse.message) {
      throw new ProxiedError(
        response.message ? response.message : 'Article voting failed',
        response.error_code ? response.error_code : 0,
        config.restApiEndpoint.FAQArticleVote(originalId),
      );
    }

    return dataLoader.FAQArticle.load({
      originalId,
      language,
    });
  },
};
