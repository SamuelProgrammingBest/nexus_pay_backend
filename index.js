const dotenv = require("dotenv");
dotenv.config();
const express = require("express");

const cors = require("cors");

const app = express();

app.listen(process.env.PORT || 3001, (err) => {
  if (err) console.log(err);
  console.log(`Server is running on port ${process.env.PORT}`);
});

const { connectMyDb } = require("./config/db.connect");

connectMyDb();

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // Allow your React app
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
);

const AccountRouter = require("./routers/account.router");

app.use("/api/v3", AccountRouter);

// Account Model
// Transfer Model
//
