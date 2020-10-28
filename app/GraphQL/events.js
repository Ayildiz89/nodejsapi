import { gql, ApolloError } from 'apollo-server-express'
import * as db from '../database'
import * as token_control from '../modules/token_control'


const Op = db.Sequelize.Op;

export const typeDefs = gql`
    extend type Query {
        events(
            token:String! 
            class_id: ID, 
            company_id: ID!, 
            student_id: ID, 
            start: Date, 
            end:Date, 
            teacher_id: ID,
            reportnotnull: Boolean
            ): [Event]
        event(token:String!,id: ID!): Event
    }

    type Event {
        id: ID!
        company_id: ID
        title: String
        class_id: ID
        teacher_id: ID
        classroom_id: ID
        description: String
        color: String
        start: Date
        end: Date
        allday: Boolean
        created_at: Date
        updated_at: Date
        course: Course
        students: [User]
        teacher: User
        lesson: Lesson
        classroom: Classroom
        checklist: [CheckList]
        reports(create_user:ID student_id:ID, report_type: ID): [Report]
        report_exist: Boolean
    }
`

export const resolvers = {
    Query: {
        event: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return await db.events.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        events: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                let where = {
                    company_id:args.company_id
                }
                if(args.class_id){
                    where = {
                        ...where,
                        class_id:args.class_id
                    }
                }
                if(args.teacher_id){
                    where = {
                        ...where,
                        teacher_id:args.teacher_id
                    }
                }
                if(args.student_id){
                    const user_events = await db.event_users.findAll({where:{user_id:args.student_id}})
                    const ids = user_events.map(u=>u.event_id)
                    where = {
                        ...where,
                        id:{
                            [Op.in]:ids
                        }
                    }
                }
                if(args.start&&args.end){
                    where = {
                        ...where,
                        start:{
                            [Op.between]:[args.start, args.end]
                        }
                    }
                }
                return await db.events.findAll({where})
            } else {
                throw new ApolloError("token is required",1000)
            }
        }
    },
    Event: {
        course: async (obj, args, context, info) => {
            return await db.classes.findByPk(obj.class_id)
        },
        students: async (obj, args, context, info) => {
            const users_id = await db.event_users.findAll({where:{event_id:obj.id}})
            const ids = users_id.map(u=>u.user_id)
            
            return db.users.findAll({
                where:{
                    id:{
                        [Op.in]:ids
                    }
                }
            })
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
        checklist: async (obj, args, context, info) => {
            const checks_id = await db.event_check_list.findAll({
                where:{
                    events_id:obj.id
                }
            })
            const ids = checks_id.map(c=>c.dataValues.check_list_id)
            return await db.check_list.findAll({
                where:{
                    [Op.or]:[
                        {
                            id:
                            {
                                [Op.in]:ids
                            }
                        },
                        {
                            allclass: 1
                        }
                    ]
                }
            })
        },
        reports: async (obj, args, context, info) => {
            
            let where = {
                event_id:obj.id
            }
            if(args.create_user){
                where={
                    ...where,
                    create_user_id: args.create_user
                }
            }
            if(args.student_id){
                where={
                    ...where,
                    student_id:args.student_id
                }
            }
            if(args.report_type){
                where={
                    ...where,
                    report_type:args.report_type
                }
            }
            return await db.reports.findAll({
                where
            })
        },
        report_exist: async (obj, args, context, info) => {
            
            let where = {
                event_id:obj.id
            }
            if(args.create_user){
                where={
                    ...where,
                    create_user_id: args.create_user
                }
            }
            const reports = await db.reports.findAll({
                where
            })
            return reports.length?true:false
            
        },
    }
}