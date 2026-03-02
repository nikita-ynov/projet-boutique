require('dotenv').config()
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;


app.use(cors({
    origin: true
}))

const sneakerRouter = require("./router/plush")
app.use(sneakerRouter)

app.listen(PORT, () =>
    console.log(`=========== EXPRESS JS ===========\n         Server started.\n           PORT: ${PORT}\n      http://localhost:3333/\n=========== EXPRESS JS ===========`)
)