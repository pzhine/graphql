[![CircleCI](https://circleci.com/gh/kiwicom/graphql/tree/master.svg?style=svg)](https://circleci.com/gh/kiwicom/graphql/tree/master)

Production URL: https://graphql.kiwi.com/

[Join our chat over at Discord](https://discord.gg/Pq2q5a5) to get in touch with the community and Kiwi.com engineers.

This GraphQL API proxy is written for serverless infrastructure. This assumption is especially important in case of dataloaders. For more information please read: https://github.com/facebook/dataloader#caching-per-request

# Run GraphQL API server

Using this command you can run GraphQL API server with HMR (Hot Module Replacement).

```
yarn start
```

Server is running by default on `http://127.0.0.1:3000/`

# Run GraphQL and Apollo Engine

[Apollo Engine](https://www.apollographql.com/engine/) acts as a proxy between
client and GraphQL server. It brings features like performance tracing, error
tracking or caching.

It can be handy to check performance during development. To run Apollo Engine
on localhost you'll need to fill in the `ENGINE_KEY` environmental variable.

# Run tests

```
yarn test
yarn test-ci
```

# Directory structure

```
src
├── booking
│    ├── queries
│    │    ├── AllBookings.js
│    │    └── SingleBooking.js
│    ├── mutations (if exists)
│    ├── dataloaders + API sanitizers
│    ├── types
│    │    ├── outputs
│    │    ├── inputs
│    │    └── enums
│    ├── resolvers (if exists)
│    └── datasets
├── flight
│    └── ditto
├── hotel
├── location
├── identity
└── common (contains shared services)
```

Motivations: there is point in time in every application where doing groups by generic "outputs" or "inputs" is not enough and it's becoming a mess. For this reason it's better to group application parts by responsibilities. With this structure the project is less flat and more deep.

# Design Style Guides

These style guides are not applied in this project correctly and it's wrong. However, this guide should help to integrate them and to improve overall design of this proxy.

## Localisation

Some queries relies on input argument `Locale`, but soon we realized we would end-up with every query accepting locale. Therefore we opted for `Accept-Language` HTTP header.

Always use just `locale` property from GraphQL context for localisation. `Locale` is deprecated.

## Output Types

Every output type should provide relevant fields. This is basically why we are writing this proxy. It's good idea to write descriptions to every field because even though it may be obvious for you - it may significantly help others.

Because we are using Flow for type checking you should write these Flow types next to GraphQL output types:

```js
export type HotelCity = {|
  name: string,
|};

export default new GraphQLObjectType({
  name: 'HotelCity',
  fields: {
    name: {
      type: GraphQLString,
      description: 'Name of the hotel.',
      resolve: ({ name }: HotelCity): string => name,
    },

    // ...
  },
});
```

Why you may ask? It's because in this case the Flow type defines the interface of the GraphQL type so no matter who is the ancestor of this type - the interface is clear and defined here. It's very good idea ty write resolve functions even though they may seem useless (like in this case). It's because Flow is not clever enough in this case and you may get into troubles: Let's say you want to return object for another GraphQL type (not string). In this case Flow is not able to check if the returned type from resolve function is correct unless you specify what are you actually returning. It's like checking if inputs and outputs of the resolve function are correct. This is the only way how to write GraphQL types safely. Example:

```js
export type HotelCity = {|
  name: string,
|};

export default new GraphQLObjectType({
  name: 'HotelCity',
  fields: {
    name: {
      type: GraphQLString,
      description: 'Name of the hotel.',
      resolve: ({ name }: HotelCity) => -1, // return type is missing
    },
  },
});
```

Flow is happy but it's obviously wrong because GraphQL expects string (`GraphQLString`). It may trigger GraphQL error in more complicated situations (non-scalars). Luckily the Flow types are in the same file as GraphQL output type so you can import them easily:

```js
import GraphQLAddress, { type GraphQLAddress } from './GraphQLAddress';
```

## Data Loaders

We use data loaders to fetch all other resources in a clever way. They do not repeat the same query if not necessary so they behave like a ephemeral cache during one GraphQL request. Currently we are fetching data only from other REST endpoints but we may fetch them from database in the future.

You can read more about data loaders here: https://github.com/facebook/dataloader

Typing data loaders may by very complicated. They basically have input + output types and they are not closely related to the Flow types in GraphQL output types. It's because they are not tightly coupled and GraphQL type may have a lot of sources. Therefore in perfect world you should use Flow type for underlying API response and Flow type for sanitized data loader result. You can use [JSON to Flow](https://transform.now.sh/json-to-flow-types/) converter to create API response types. However you should always modify the result because it's not perfect. API may return errors, empty responses and so on:

```js
type ApiResponse = ValidResponse | ErrorResponse | NoResultResponse;

type ValidResponse = Array<{|
  translations: Array<{|
    language: string,
    name: string,
  |}>,
  location: {|
    latitude: string,
    longitude: string,
  |},
  name: string,
  country: string,
  nr_hotels: number,
  city_id: number,
|}>;
type NoResultResponse = [];
type ErrorResponse = {|
  error: string,
|};
```

Sometimes it's convenient to use Flow types from GraphQL output type to annotate data loader result. It's not clean nor perfect but we allow this for now.

# Requirements of a Relay-compliant GraphQL server

- [Cursor Connections Specification](https://facebook.github.io/relay/graphql/connections.htm)
- [Global Object Identification Specification](https://facebook.github.io/relay/graphql/objectidentification.htm)
- [Input Object Mutations Specification](https://facebook.github.io/relay/graphql/mutations.htm)
