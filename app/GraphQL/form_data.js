import { gql, ApolloError } from 'apollo-server-express'
//import { GraphQLScalarType } from 'graphql';
import * as db from '../database'
import * as token_control from '../modules/token_control'

export const typeDefs = gql`
    extend type Query {
        form_data(token:String!,company_id:ID!, type_id: ID!): [FormData]
    }

    type FormData {
        id: ID!
        company_id: ID
        type_id: ID
        required: Boolean
        element_label: String
        name: String
        element_type_id: ID
        child_data: String
    }
`

export const resolvers = {
    Query: {
        form_data: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                let where = {
                    company_id:args.company_id
                }
                if(args.type_id){
                    where = {
                        ...where,
                        type_id:args.type_id
                    }
                }
                const formData = await db.form_data.findAll({where})
                return formData
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
    }
}