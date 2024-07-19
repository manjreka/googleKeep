const mongoose = require('mongoose')


const noteSchema  = new mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    deletedAt: {type: Date, default: null},  // to handle trash
    archived: {type: Boolean, default: false}, // to handle archive
    label: [{type: String}] // to handle labels 
}) 

noteSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Note = mongoose.model('Note', noteSchema)

module.exports = Note