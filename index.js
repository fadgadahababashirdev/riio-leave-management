require('dotenv').config();
const PORT = 2001;
const express = require('express');
const router = require('./routes/riioRoute');
const app = express();

app.use(express.json());

app.listen(PORT, () => console.log(`app is running on http://localhost:${PORT}`));
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


