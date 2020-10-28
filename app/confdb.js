const dotenv = require("dotenv")
dotenv.config()

const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT} = process.env;

module.exports = [
    DB_NAME, DB_USER, DB_PASS, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        define: {
            freezeTableName: true,
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
        operatorsAliases: false,
    }
]