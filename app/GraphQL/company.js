import { gql, ApolloError } from 'apollo-server-express'
import * as db from '../database'
import * as token_control from '../modules/token_control'

export const typeDefs = gql`
    extend type Query {
        company(token:String!,id: ID!): Company
    }

    type Company {
        id: ID!
        name: String
        logo: String
        is_active: Boolean
        address: String
        country: String
        city: String
        postcode: String
        street: String
        houseno: String
        tel: String
        accountname: String
        iban: String
        bic: String
        bank: String
        plan: Int
        created_at: Date
        updated_at: Date
    }
`

export const resolvers = {
    Query: {
        company: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return db.company.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
        }
    }
}