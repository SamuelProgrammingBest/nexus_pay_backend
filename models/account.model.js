const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },

        middleName: {
            type: String,
            required: true,
        },

        lastName: {
            type: String,
            required: true,
        },

        email: {
            type:String,
            required:true,
            unique:true,
        },

        password: {
            type:String,
            required:true,
            unique:true
        },

        fullName: {
            type: String,
        },


        NIN:{
            type:Number,
            required:true,
            unique:true
        },

        accountNo:{
            type:Number,
            // required:true
        },

        PIN:{
            type:Number,
            required:true,
            unique:true
        },

        balance:{
            type:Number,
            default:15000
        }
    },
    { timestamps: true, strict: true },
);


let arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
let acc = ""
accountSchema.pre("save", function(){
    for (let i = 0; i < arr.length; i++) {
        let no = Math.floor(Math.random() * arr.length )
        acc+= arr[no]
    }
    this.accountNo = Number(acc)
    this.fullName = `${this.firstName} ${this.middleName} ${this.lastName}`
})


module.exports = accountSchema