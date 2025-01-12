'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _apiHelper = require('./apiHelper');

var _relayNode = require('./relayNode');
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a root field to get an object of a given type.
 * Accepts either `id`, the globally unique ID used in GraphQL,
 * or `idName`, the per-type ID used in SWAPI.
 */
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE-examples file in the root directory of this source tree.
 *
 *  strict
 */

function getObjectsByType(objectType) {
  const graphqlType = (0, _relayNode.swapiTypeToGraphQLType)(`${objectType}`);
  const { connectionType } = (0, _graphqlRelay.connectionDefinitions)({
    name: `Search${objectType}Results${uuidv4()
      .split('-')
      .pop()}`,
    nodeType: graphqlType,
    connectionFields: () => ({
      totalCount: {
        type: _graphql.GraphQLInt,
        resolve: conn => conn.totalCount,
        description: `A count of the total number of objects in this connection, ignoring pagination.
This allows a client to fetch the first five objects by passing "5" as the
argument to "first", then fetch the total count so it could display "5 of 83",
for example.`,
      },
      [objectType]: {
        type: new _graphql.GraphQLList(graphqlType),
        resolve: conn => conn.edges.map(edge => edge.node),
        description: `A list of all of the objects returned in the connection. This is a convenience
field provided for quickly exploring the API; rather than querying for
"{ edges { node } }" when no edge data is needed, this field can be be used
instead. Note that when clients like Relay need to fetch the "cursor" field on
the edge to enable efficient pagination, this shortcut cannot be used, and the
full "{ edges { node } }" version should be used instead.`,
      },
    }),
  });

  return {
    type: connectionType,
    args: {
      name: { type: _graphql.GraphQLString },
      title: { type: _graphql.GraphQLString },
    },
    resolve: async (_, args) => {
      const query = args.name ? args.name : args.title;
      const { objects, totalCount } = await (0, _apiHelper.queryObjects)(
        objectType,
        query,
      );
      console.log(JSON.stringify(objects, null, 5));
      return {
        ...(0, _graphqlRelay.connectionFromArray)(objects, args),
        totalCount,
      };
    },
  };
}

/**
 * Creates a root field to get an object of a given type.
 * Accepts either `id`, the globally unique ID used in GraphQL,
 * or `idName`, the per-type ID used in SWAPI.
 */
function rootFieldByID(idName, swapiType) {
  const getter = id => (0, _apiHelper.getObjectFromTypeAndId)(swapiType, id);
  const argDefs = {};
  argDefs.id = { type: _graphql.GraphQLID };
  argDefs[idName] = { type: _graphql.GraphQLID };

  return {
    type: (0, _relayNode.swapiTypeToGraphQLType)(swapiType),
    args: argDefs,
    resolve: (_, args) => {
      console.log(JSON.stringify(args, null, 5));
      if (args[idName] !== undefined && args[idName] !== null) {
        return getter(args[idName]);
      }

      if (args.id !== undefined && args.id !== null) {
        const globalId = (0, _graphqlRelay.fromGlobalId)(args.id);
        if (
          globalId.id === null ||
          globalId.id === undefined ||
          globalId.id === ''
        ) {
          throw new Error('No valid ID extracted from ' + args.id);
        }
        return getter(globalId.id);
      }
      throw new Error('must provide id or ' + idName);
    },
  };
}

/**
 * Creates a connection that will return all objects of the given
 * `swapiType`; the connection will be named using `name`.
 */
function rootConnection(name, swapiType) {
  const graphqlType = (0, _relayNode.swapiTypeToGraphQLType)(swapiType);
  const { connectionType } = (0, _graphqlRelay.connectionDefinitions)({
    name,
    nodeType: graphqlType,
    connectionFields: () => ({
      totalCount: {
        type: _graphql.GraphQLInt,
        resolve: conn => conn.totalCount,
        description: `A count of the total number of objects in this connection, ignoring pagination.
This allows a client to fetch the first five objects by passing "5" as the
argument to "first", then fetch the total count so it could display "5 of 83",
for example.`,
      },
      [swapiType]: {
        type: new _graphql.GraphQLList(graphqlType),
        resolve: conn => conn.edges.map(edge => edge.node),
        description: `A list of all of the objects returned in the connection. This is a convenience
field provided for quickly exploring the API; rather than querying for
"{ edges { node } }" when no edge data is needed, this field can be be used
instead. Note that when clients like Relay need to fetch the "cursor" field on
the edge to enable efficient pagination, this shortcut cannot be used, and the
full "{ edges { node } }" version should be used instead.`,
      },
    }),
  });
  return {
    type: connectionType,
    args: _graphqlRelay.connectionArgs,
    resolve: async (_, args) => {
      const { objects, totalCount } = await (0, _apiHelper.getObjectsByType)(
        swapiType,
      );
      return {
        ...(0, _graphqlRelay.connectionFromArray)(objects, args),
        totalCount,
      };
    },
  };
}

/**
 * The GraphQL type equivalent of the Root resource
 */
const rootType = new _graphql.GraphQLObjectType({
  name: 'Root',
  fields: () => ({
    allFilms: rootConnection('Films', 'films'),
    film: rootFieldByID('filmID', 'films'),
    allPeople: rootConnection('People', 'people'),
    person: rootFieldByID('personID', 'people'),
    peopleByName: getObjectsByType('people'),
    planetsByName: getObjectsByType('planets'),
    filmsByTitle: getObjectsByType('films'),
    speciesByName: getObjectsByType('species'),
    vehiclesByName: getObjectsByType('vehicles'),
    starshipsByName: getObjectsByType('starships'),
    allPlanets: rootConnection('Planets', 'planets'),
    planet: rootFieldByID('planetID', 'planets'),
    allSpecies: rootConnection('Species', 'species'),
    species: rootFieldByID('speciesID', 'species'),
    allStarships: rootConnection('Starships', 'starships'),
    starship: rootFieldByID('starshipID', 'starships'),
    allVehicles: rootConnection('Vehicles', 'vehicles'),
    vehicle: rootFieldByID('vehicleID', 'vehicles'),
    node: _relayNode.nodeField,
  }),
});

exports.default = new _graphql.GraphQLSchema({ query: rootType });
