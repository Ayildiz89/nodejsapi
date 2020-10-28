import { gql, ApolloError } from 'apollo-server-express'
//import { GraphQLScalarType } from 'graphql';
import * as db from '../database'
import * as token_control from '../modules/token_control'

const Op = db.Sequelize.Op;

export const typeDefs = gql`
    extend type Query {
        check_list(token:String!,company_id:ID!): [CheckList]
        check(token:String!,id: ID!): CheckList
    }

    extend type Mutation {
        createCheck(token:String! company_id:ID!, name:String!, type_id:ID!,  allclass:Boolean, isrequired:Boolean, events:[ID], courses:[ID]): CheckList,
        
        updateCheck(token:String! id:ID!, company_id:ID, name:String, type_id:ID, allclass:Boolean, isrequired:Boolean, events:[ID], courses:[ID]): CheckList,

        deleteCheck(token:String! id:ID!):Boolean,
    }

    type CheckList {
        id: ID!
        name: String
        type_id: ID
        allclass:Boolean
        isrequired: Boolean
        existevent:Boolean
        existcourse:Boolean
        events:[Event]
        events_id:[ID]
        courses_id:[ID]
        reports(event_id: ID, student_id: ID, course_id: ID): [Report]
    }
`

export const resolvers = {
    Query: {
        check_list: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return db.check_list.findAll({where:{company_id:args.company_id}})
            } else {
                throw new ApolloError("token is required",1000)
                   
            }
        },
        check: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                return await db.check_list.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
        }
    },
    Mutation: {
        createCheck: async (obj, {token, company_id, name, type_id, allclass, isrequired, events=[], courses=[]}, context, info) => {
            const tk_status = await token_control(token)
            if(tk_status){
                let opt = {
                    company_id,
                    name, 
                    type_id, 
                    allclass,
                    isrequired,
                    created_at: new Date(),
                    updated_at: new Date()
                }
                const onlycheck = await db.check_list.create(opt)
                .then(result => {
                    return result
                  })
                  .catch(err => {
                    console.log(err);
                  });
                let check;
                if(events.length || courses.length)
                {
                    let data = [];
                    events.map(e=>{
                        data.push({
                            check_list_id: onlycheck.id,
                            events_id:e,
                            class_id:null
                        })
                    })
                    courses.map(c=>{
                        data.push({
                            check_list_id:onlycheck.id,
                            events_id:null,
                            class_id:c
                        })
                    })
                    
                    check = await db.event_check_list.bulkCreate(data)
                    .then(result=>{
                        return {
                            ...onlycheck.dataValues,
                            courses,
                            events
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
                }
                return check
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
        updateCheck: async (obj, args, context, info) => {
            const tk_status = await token_control(args.token)
            if(tk_status){
                let data = {} 
                const elements = Object.keys(args).filter(o=>args[o]&&o!=="id"||o!=="events"||o!=="courses")
                elements.map(o=>{
                    //if(){
                        data = {
                            ...data,
                            [o]: args[o]
                        }
                    //}
                })
                console.log(data,args)
                await db.check_list.update(data,
                    {
                        where: {
                            id: args.id
                        }
                    })
                  .catch(err => {
                    console.log(err);
                  });
                const event_check_list = await db.event_check_list.findAll({
                    where:{
                        check_list_id:args.id
                    }
                })
                const ids = event_check_list.map(ec=>ec.id)
                db.event_check_list.destroy({
                    where: {
                        id: {
                            [Op.in]:ids
                        }
                    }
                }).then(result=>{
                    const events = args.events
                    const courses = args.courses
                    if(events.length || courses.length)
                    {
                        let data = [];
                        events.map(e=>{
                            data.push({
                                check_list_id: args.id,
                                events_id:e,
                                class_id:null
                            })
                        })
                        courses.map(c=>{
                            data.push({
                                check_list_id:args.id,
                                events_id:null,
                                class_id:c
                            })
                        })
                        db.event_check_list.bulkCreate(data)
                        .then(result=>{
                            
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    }
                })
                return await db.check_list.findByPk(args.id)
            } else {
                throw new ApolloError("token is required",1000)
            }
            
        },
        
        deleteCheck: async (obj, {token, id}, context, info) => {
            const tk_status = await token_control(token)
            if(tk_status){
                db.check_list.destroy({
                    where:{
                        id
                    }
                }).then(result=>{
                    console.log(result)
                    return true
                })
            } else {
                throw new ApolloError("token is required",1000)
            }
        }
    },
    CheckList: {
        existevent: async (obj, args, context, info) => {
            const events_check_id = await db.event_check_list.findAll({
                where:{
                    check_list_id:obj.id
                }
            })

            const events_ids = events_check_id.map(ec=>ec.events_id)
            const status = events_ids.filter(i=>i!==null)
            return status.length?true:false
        },
        existcourse:  async (obj, args, context, info) => {
            const events_check_id = await db.event_check_list.findAll({
                where:{
                    check_list_id:obj.id
                }
            })
            const class_ids = events_check_id.map(ec=>ec.class_id)
            const status = class_ids.filter(i=>i!==null)
            return status.length?true:false
        },
        events: async (obj, args, context, info) => {
            const events_check_id = await db.event_check_list.findAll({
                where:{
                    check_list_id:obj.id
                }
            })
            const events_ids = events_check_id.map(ec=>ec.events_id)
            return await db.events.findAll({
                where:{
                    id:{
                        [Op.in]:events_ids
                    }
                }
            })
        },
        events_id: async (obj, args, context, info) => {
            const events_check_id = await db.event_check_list.findAll({
                where:{
                    check_list_id:obj.id
                }
            })
            const filtered = events_check_id.filter(c=>c.dataValues.events_id!==null)
            return filtered.map(e=>e.dataValues.events_id)
        },
        courses_id: async (obj, args, context, info) => {
            const events_check_id = await db.event_check_list.findAll({
                where:{
                    check_list_id:obj.id
                }
            })
            const filtered = events_check_id.filter(c=>c.dataValues.class_id!==null)
            return filtered.map(e=>e.dataValues.class_id)
        },
        reports: async (obj, args, context, info) => {
            let where = {
                check_id: obj.id
            }
            if(args.event_id){
                where = {
                    ...where,
                    event_id:args.event_id
                }
            }
            if(args.student_id){
                where = {
                    ...where,
                    student_id:args.student_id
                }
            }
            /*if(args.course_id){
                const events = await db.events.findAll({
                    where:{class_id:args.course_id}
                })
                const events_id = events.map(e=>e.id)                
                where = {
                    ...where,
                    event_id: {
                        [Op.in]:events_id
                    }
                }
            }*/
            return await db.reports.findAll({
                where
            })
        }
    }
}