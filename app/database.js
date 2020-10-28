const Sequelize = require('sequelize');
const confdb = require('./confdb')
var db = {}

const sequelize = new Sequelize(...confdb)

let models = [
    require('./models/priorities.js'),
    require('./models/status.js'),
    require('./models/tickets.js'),
    require('./models/users.js'),
    require('./models/company'),
    require('./models/user_company.js'),
    require('./models/courses.js'),
    require('./models/check_list'),
    require('./models/category'),
    require('./models/classroom'),
    require('./models/event_check_list'),
    require('./models/event_users'),
    require('./models/events'),
    require('./models/form_data'),
    require('./models/lesson'),
    require('./models/notifications'),
    require('./models/reports'),
    require('./models/reports_of_event'),
    require('./models/user_other_data'),
    require('./models/company_templates'),
    require('./models/view_current_courses'),
    require('./models/current_courses'),
    require('./models/students_status'),
    require('./models/students_statistics'),
    require('./models/verifications_code'),
    require('./models/sent_mails')
    
]

// Initialize models
models.forEach(model => {
    const seqModel = model(sequelize, Sequelize)
    db[seqModel.name] = seqModel
})

// Apply associations
Object.keys(db).forEach(key => {
    if ('associate' in db[key]) {
        db[key].associate(db)
        console.log("A----------->",db[key])
    }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
