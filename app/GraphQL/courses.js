import { gql, ApolloError } from 'apollo-server-express'
import * as db from '../database'
import * as token_control from '../modules/token_control'

const Op = db.Sequelize.Op;

export const typeDefs = gql`
    extend type Query {
        courses(token:String!,company_id: ID!, witharchived:Boolean): [Course]
        course(token:String!,id: ID!): Course,
        courses_statistic(token:String!,company_id: ID!): CoursesStatistic
    }

    type CoursesStatistic {
        complated: Int,
        willstart: Int,
        contuning: Int
    }

    type Course {
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
        events(user_id: ID): [Event]
        teacher: User
        lesson: Lesson
        classroom: Classroom
        count(company_id:ID): Int
        events_count(user_id: ID): Int
        check_list: [CheckList]
        status: Int
    }
`

export const resolvers = {
    Query: {
        courses: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                let where = {
                    company_id:args.company_id
                }
                if(!args.witharchived||args.witharchived===undefined){
                    where = {
                        ...where,
                        is_archived:false
                    }
                }
                const courses = await db.classes.findAll({where})
                console.log(courses.length)
                return courses
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        course: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return await db.classes.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        courses_statistic: async (obj, args, context, info) => {

        }
    },
    Course: {
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
            const events = await db.events.findAll({
                order:[['start', 'asc']],
                where
            })
            return events
        },
        status: async (obj, args, context, info) => {
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
            const events = await db.events.findAll({
                order:[['start', 'asc']],
                where
            })
            return (new Date(events[0].start)>new Date())?2:((new Date(events[events.length-1].start)>=new Date())&&(events[0].start<=new Date())?1:0)
        },
        events_count: async (obj, args, context, info) => {
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
            return await db.events.count({where})
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
        count: async (obj, args, context, info) => {
            return await db.classes.count({
                where:{
                    company_id:args.company_id
                }
            })
            //return courses.length
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