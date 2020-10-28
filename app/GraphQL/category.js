import { gql, ApolloError } from 'apollo-server-express'
//import { GraphQLScalarType } from 'graphql';
import * as db from '../database'
import * as token_control from '../modules/token_control'

export const typeDefs = gql`
    extend type Query {
        categories(token:String!,company_id:ID!): [Category]
        category(token:String!,id: ID!): Category
    }

    type Category {
        id: ID!
        name: String
        description: String
    }
`

export const resolvers = {
    Query: {
        categories: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return db.category.findAll({where:{company_id:args.company_id}})
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        category: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return db.category.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
        }
    }
}