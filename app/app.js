import '@babel/polyfill'
import express from 'express';
import { sendMail } from './modules/sendMail';
const dotenv = require('dotenv');
const GraphQLJSON = require('graphql-type-json');
const bodyParser = require('body-parser');
const { ApolloServer } = require('apollo-server-express')
const cors = require('cors')
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

dotenv.config()

const port = process.env.PORT || 5000;

const resolveFunctions = {
    JSON: GraphQLJSON
};

const server = new ApolloServer({
    modules: [
        require('./GraphQL/tickets'),
        require('./GraphQL/status'),
        require('./GraphQL/priorities'),
        require('./GraphQL/users'),
        require('./GraphQL/category'),
        require('./GraphQL/classroom'),
        require('./GraphQL/check_list'),
        require('./GraphQL/company'),
        require('./GraphQL/courses'),
        require('./GraphQL/events'),
        require('./GraphQL/lesson'),
        require('./GraphQL/company_templates'),
        require('./GraphQL/user_other_data'),
        require('./GraphQL/form_data'),
        require('./GraphQL/reports'),
        require('./GraphQL/view_courses'),
        require('./GraphQL/current_teacher'),
        require('./GraphQL/current_courses'),
        require('./GraphQL/students_statistics'),
        require('./GraphQL/students_status'),
        require('./GraphQL/others')
    ],
    resolvers: resolveFunctions
})

server.applyMiddleware({ app })

app.get('/', (req, res) => res.send(`Welcome to EDUCSYS!`))

app.get('/trymail', (req, res) => {
    sendMail({
        to:"eozbayirtibat@gmail.com",
        from:"EDUCSYS <member@educsys.de>",
        subject:"Denmeeeee",
        template:"verification_code",
        context:{
            text: "Dogrulama kodunuz:",
            code: "25675"
        }})
    return res.send("Mail gönderildi")
})

app.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:${port}`),
)

