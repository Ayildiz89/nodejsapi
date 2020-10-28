import { gql, ApolloError } from 'apollo-server-express'
import * as db from '../database'
import * as token_control from '../modules/token_control'

export const typeDefs = gql`
    extend type Query {
        current_teachers(token:String!,company_id: ID!): [CurrentTeacher]
    }

    type CurrentTeacher {
        id: ID!
        first_name: String
        last_name: String
    }
`

export const resolvers = {
    Query: {
        current_teachers: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                const r= await db.sequelize.query("SELECT id,first_name FROM current_teachers")
                console.log("AAA--------------->",r[0])
                return r[0]
            } else {
                throw new ApolloError("token is required",1000)
            }
        }
    }
}