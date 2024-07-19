const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    email: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password:{type: String, required: true},
    confirmPassword: {type: String, required: true} 
})

const users = mongoose.model('users', userSchema )

module.exports = users