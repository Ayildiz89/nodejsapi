import { gql } from 'apollo-server-express'
import * as db from '../database';
import * as token_control from '../modules/token_control';

export const typeDefs = gql`
    extend type Query {
        userbirtdays(token: String! company_id: ID!, inday:Int): [BirtDayList]
        
    }

    type BirtDayList {
        full_name: String!
        id: ID
        birthday: Date
        years: Int
    }
`

export const resolvers = {
    Query: {
        userbirtdays: async (obj, {company_id, token}, context, info) => {
            const tk_status = await token_control(token)
            if(tk_status){
                const users = await db.users.findAll({where:{company_id}})
                console.log(users)
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
    }
}