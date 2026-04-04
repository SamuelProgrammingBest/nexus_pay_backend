const express = require('express'); 
const dotenv = require('dotenv');
dotenv.config()

const app = express();

app.listen(process.env.PORT || 3001, (err)=>{
    if(err) console.log(err)
    console.log(`Server is running on port ${process.env.PORT}`);
})

const {connectMyDb} = require("./config/db.connect")

connectMyDb()


app.use(express.json())

const AccountRouter = require("../Banking Backend/routers/account.router")

app.use("/api/v3", AccountRouter)

// Account Model
// Transfer Model
// 