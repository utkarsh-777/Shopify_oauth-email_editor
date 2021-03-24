const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    template:{
        type:String,
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model('Template',templateSchema);