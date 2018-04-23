// @flow

import { GraphQLObjectType } from 'graphql';

import Login from './identity/mutations/Login';
import FAQArticleVote from './FAQ/mutations/FAQArticleVote';

export default new GraphQLObjectType({
  name: 'RootMutation',
  description: 'Root Mutation.',
  fields: {
    login: Login,
    FAQArticleVote,
  },
});
