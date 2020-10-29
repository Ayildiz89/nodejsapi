import { gql } from 'apollo-server-express'
import * as db from '../database';
import * as token_control from '../modules/token_control';

export const typeDefs = gql`
    extend type Query {
        userbirthdays(token: String! company_id: ID!): [BirthDayList]
        
    }

    type BirthDayList {
        first_name: String!
        last_name: String
        id: ID
        birthday: Date
        next_birthday: Date
        old: Int
    }
`
const Op = db.Sequelize.Op;
export const resolvers = {
    Query: {
        userbirthdays: async (obj, {company_id, token}, context, info) => {
            const today = new Date(new Date().setHours(0,0,0,0));
            const tk_status = await token_control(token)
            if(tk_status){

                const where = {
                    where:{company_id}
                }

                const user_ids = (await db.user_company.findAll(where)).map(uc=>uc.user_id)

                const where2 = {
                    where:{id:{[Op.in] : user_ids}}
                }

                const raw_users = await db.users.findAll({...where2}).filter(u=>u.birthday!==null)
                const users = raw_users.map(u=>{
                    const raw_birthday = new Date(u.birthday);
                    
                    const next_birthday = new Date(raw_birthday.setFullYear(today.getFullYear())<today?raw_birthday.setFullYear(today.getFullYear()+1):raw_birthday.setFullYear(today.getFullYear()))
                    return {
                        id: u.id,
                        first_name: u.first_name,
                        last_name: u.last_name,
                        next_birthday,
                        birthday: u.birthday,
                        old:parseInt((next_birthday-u.birthday)/(1000*60*60*24*365.20))
                    }
                })

                const inday = 14; //Daha sonra database den gelecek
                
                let filtered_users = users.filter(u=>{
                    if(new Date(u.next_birthday)<new Date(today.getTime()+(inday*1000*60*60*24)))
                    return true;
                    else return false
                });
                return filtered_users.sort((a,b)=>{return (new Date(a.next_birthday)-new Date(b.next_birthday))})
            } else {
                throw new ApolloError("token is required",1000)
            }
        },
    }
}