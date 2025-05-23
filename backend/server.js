import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';

// App Config
const app=express();
const port=process.env.PORT || 4000;
connectDB();
connectCloudinary()

// Middlewares
app.use(express.json())
app.use(cors())

// Api endpoint
app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)
// localhost:4000/api/admin

app.get('/',(req,res)=>{
    res.send("API Working Properly !!")
})

app.listen(port,()=>{
    console.log(`Server started at port : ${port}`)
})