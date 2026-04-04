const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
    {
        fromId:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:"account",
            required:true
        },
        

        toId:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:"account",
            required:true
        },
        
        amount:{
            type:Number,
            required:true
        },

        date:{
            type:Date,
            default:Date.now()
        },

        senderBalanceAfter:{
            type:Number,
            required:true
        },

        recieverBalanceAfter:{
            type:Number,
            required:true
        },

        transferID:{
            type:String,
            required:true
        }

    },
    { timestamps: true, strict: true },
);

let arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] 
let acc = "TRX-"
transferSchema.pre("save", function(){
    for (let i = 0; i < 8; i++) {
        let no = Math.floor(Math.random() * arr.length )
        acc+= arr[no]
    }
    this.transferID = acc
})



let transfers = mongoose.model("transfer", transferSchema)

module.exports = transfers