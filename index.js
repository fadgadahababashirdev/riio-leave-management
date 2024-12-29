require('dotenv').config();

const express = require('express');
const router = require('./routes/riioRoute');
const morgan = require("morgan")
const app = express();

const PORT = process.env.APP_PORT || 1200
app.use(express.json());
app.use(morgan('combined'));

app.listen(process.env.APP_PORT, () => console.log(`app is running on http://localhost:${PORT}`));
// appRoute 
app.get("/" , (req ,res)=>{
    res.status(200).json({status:"success" , message:"app is running successfully"})
}) 
app.use("/" , router)
// the universal route 
app.get("*" , (req , res)=>{
    try {
        res.status(404).json({status:"failed" , message:"route not found "})
    } catch (error) {
        res.status(500).json({status:"failed" , message:error.message})
    }
}) 


