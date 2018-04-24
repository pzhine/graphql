// @flow

import express from 'express';
import graphqlHTTP from 'express-graphql';
import cors from 'cors';
import compression from 'compression';
import { formatEntry, logEntry } from 'graphql-optics-tracer';

import type { $Request, $Response } from 'express';
import {
  TraceCollector,
  instrumentSchemaForTracing,
  formatTraceData,
} from 'apollo-tracing';

import Schema from './Schema';
import { createContext } from './common/services/GraphqlContext';
import Logger from './common/services/Logger';
import { ProxiedError } from './common/services/errors/ProxiedError';

require('dotenv').config();

process.on('unhandledRejection', reason => {
  Logger.error(reason);
});

const app = express();
app.use(cors({ methods: ['GET', 'POST'] }));
app.use(compression());

app.use('/', (request: $Request, response: $Response) => {
  if (process.env.NODE_ENV === 'production' && request.method === 'GET') {
    return response.status(405).json({
      message: 'Use POST for GraphQL request.',
      hint: 'Maybe you are looking for GraphiQL? https://kiwi-graphiql.now.sh/',
    });
  }

  const token = request.header('authorization') || null;
  const context = createContext(token);
  if (process.env.NODE_ENV !== 'test' && !process.env.IS_LAMBDA) {
    const traceCollector = new TraceCollector();
    traceCollector.requestDidStart();
    context._traceCollector = traceCollector;
  }
  return createGraphqlServer(Schema, context)(request, response);
});

export default app;

function createGraphqlServer(schema, context) {
  return graphqlHTTP((request, response, graphQLParams) => ({
    schema: instrumentSchemaForTracing(schema),
    pretty: false,
    graphiql: true,
    context: context,
    formatError(error) {
      let errorMessage = `${error.name}: ${error.message}`;

      const originalError = error.originalError;
      if (originalError instanceof ProxiedError) {
        error._proxy = {
          statusCode: originalError.originStatusCode,
          url: originalError.originUrl,
        };
        errorMessage += ` ${originalError.originUrl}`;
      }

      Logger.error(errorMessage);
      return error;
    },
    extensions: req => {
      const traceCollector = context._traceCollector;
      if (!traceCollector) return {};
      traceCollector.requestDidEnd();

      // graphql-optics-tracer
      const definitions = req.document.definitions;
      const graphql = graphQLParams.query;
      const metrics = formatTraceData(traceCollector);
      const entry = formatEntry({ request: { definitions, graphql }, metrics });
      logEntry({ entry });
      return {};
    },
  }));
}
