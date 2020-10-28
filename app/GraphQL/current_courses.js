import { gql, ApolloError } from 'apollo-server-express'
import * as db from '../database'
import * as token_control from '../modules/token_control'
const { QueryTypes } = require('sequelize');

const Op = db.Sequelize.Op;

export const typeDefs = gql`
    extend type Query {
        current_courses(token:String!,company_id: ID!, witharchived:Boolean): [CurrentCourse]
        count_continuing_courses(token:String!,company_id: ID!, witharchived:Boolean): Int

    }

    type CurrentCourse {
        id: ID!
        company_id: ID
        name: String
        lesson_id: ID
        teacher_id: ID
        classroom_id: ID
        description: String
        color: String
        inspection: Boolean
        is_archived: Boolean
        stupri: String
        teapri: String
        created_at: Date
        updated_at: Date
        complated_events:Int
        total_students: Int
        statu: Int
        events_count: Int
        events(user_id: ID): [Event]
        teacher: User
        lesson: Lesson
        classroom: Classroom
        check_list: [CheckList]
    }
`

export const resolvers = {
    Query: {
        current_courses: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                let where = {
                    company_id:args.company_id
                }
                if(!args.witharchived){
                    where = {
                        ...where,
                        [Op.or]:[{
                            is_archived:false
                        },
                        {
                            is_archived:null
                        }]
                    }
                }
                const current_courses = await db.current_classes.findAll({where})
                
                return current_courses
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        count_continuing_courses:async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                let count=null;
                /*await db.sequelize.query(`SELECT * FROM current_classes_count WHERE company_id = ${args.company_id} AND statu = 1` , {
                    plain: false,
                    raw: false,
                    type: QueryTypes.SELECT
                  })
                  .then(res=>
                    {
                        console.log("--------->",res)
                        count = res[0].count;
                    }
                    )
                  .catch(err=>console.log("ERRRRRR",err))*/
                return 1
                /*if(!args.witharchived){
                    where = {
                        ...where,
                        [Op.or]:[{
                            is_archived:false
                        },
                        {
                            is_archived:null
                        }]
                    }
                }
                const count_current_courses = await db.current_classes.count({where})
                
                return count_current_courses*/
            } else {
                throw new ApolloError("token is required",1000)
            }
        },

        /*course: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return await db.current_classes.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
        }*/
    },
    CurrentCourse: {
        events: async (obj, args, context, info) => {
            let where = {
                class_id:obj.id
            }
            if(args.user_id){
                const user_events = await db.event_users.findAll({where:{user_id:args.user_id}})
                const ids = user_events.map(u=>u.event_id)
                where = {
                    ...where,
                    id:{
                        [Op.in]:ids
                    }
                }
            }
            return await db.events.findAll({where})
        },
        teacher: async (obj, args, context, info) => {
            return await db.users.findByPk(obj.teacher_id)
        },
        lesson: async (obj, args, context, info) => {
            return await db.lesson.findByPk(obj.lesson_id)
        },
        classroom: async (obj, args, context, info) => {
            return await db.classroom.findByPk(obj.teacher_id)
        },
        check_list: async (obj, args, context, info) => {
            const events = await db.events.findAll({
                where: {
                    class_id:obj.id
                }
            })
            const events_id = events.map(e=>e.id)
            const event_check_list = await db.event_check_list.findAll({
                where: {
                    [Op.or]:
                    {
                        class_id: obj.id,
                        events_id: {
                            [Op.in]:events_id
                        }
                    }
                }
            })
            const checks_id = event_check_list.map(e=>e.check_list_id)
            const checks = db.check_list.findAll({
                where: {
                    [Op.or]:
                    {
                        allclass:true,
                        id: {
                            [Op.id]:checks_id
                        }
                    }
                }
            })
            return checks
        }
    }
}