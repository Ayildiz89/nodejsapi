import { gql, ApolloError } from 'apollo-server-express'
import * as db from '../database'
import * as token_control from '../modules/token_control'

export const typeDefs = gql`
    extend type Query {
        lessons(token:String!,company_id: ID!): [Lesson]
        lesson(token:String!,id: ID!): Lesson
    }

    type Lesson {
        id: ID!
        category_id: ID
        count: Int
        name: String
        description: String
    }
`

export const resolvers = {
    Query: {
        lessons: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                const ids = (await db.category.findAll({where:{company_id:args.company_id}})).map(uc=>uc.id)
                const Op = db.Sequelize.Op;
                return db.lesson.findAll({where:{
                    category_id:{[Op.in] : ids}
                }})
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        lesson: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return db.lesson.findByPk(args.id)
            } else {

            }
        }
    }
}