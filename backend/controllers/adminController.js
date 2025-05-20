import validator from 'validator';
import bcrypt from "bcrypt";
import {v2 as cloundinary} from "cloudinary"
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
// API for adding doctor
const addDoctor=async(req,res)=>{
    try {
        const{name,email,password,speciality,degree , experience,about,fees,address}=req.body;
        const imageFile=req.file;
        // Checking all data
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({success:false,message:"Missing Details"})
        }
        // Validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Plz Enter a valid Email"})
        }
        // Validating strong password
        if(password.length<8){
            return res.json({success:false,message:"Plz Enter a Strong Password"})
        }
        // Hashed doctor password
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt)

        //  Upload image to cloundinary
        const imageUpload=await cloundinary.uploader.upload(imageFile.path,{resource_type:"image"});
        const imageUrl=imageUpload.secure_url;
        const doctorData={
            name, email , image:imageUrl,password:hashedPassword,speciality,degree,experience,about,fees,address:JSON.parse(address),date:Date.now()
        }
        const newDoctor=new doctorModel(doctorData)
        await newDoctor.save();
        res.json({success:true,message:"Doctor Added"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
// API for admin control
const loginAdmin=async(req,res)=>{
    try {
        const{email,password}=req.body;
        console.log(email,password)
        if(email===process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token=jwt.sign(email+password,process.env.JWT_SECRET);
            res.json({success:true, token})
        }
        else{
            res.json({success:false,message:"Invalid Credentials"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
// Api for all doctor list
const allDoctors=async(req,res)=>{
    try {
        const doctors=await doctorModel.find({}).select('-password');
        res.json({success:true,doctors})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
// API to get all appointment list
const appointmentsAdmin=async(req,res)=>{
    try {
        const appointments=await appointmentModel.find({});
        res.json({success:true,appointments})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}
// API for appointment Cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // Releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorsData = await doctorModel.findById(docId);
    if (!doctorsData) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    let slots_booked = doctorsData.slots_booked || {};

    // Check if the date key exists before trying to filter
    if (slots_booked[slotDate]) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (e) => e !== slotTime
      );

      // Optional: Remove the date key if no slots are left
      if (slots_booked[slotDate].length === 0) {
        delete slots_booked[slotDate];
      }
    } else {
      console.warn(
        `Slot date '${slotDate}' not found in doctor's booked slots`
      );
    }

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.error("Booking error:", error);
    res.json({ success: false, message: error.message });
  }
};
// API to get dashboard data for admin panel
const adminDashboard=async(req,res)=>{
  try {
    const doctors=await doctorModel.find({});
    const users=await userModel.find({})
    const appointments=await appointmentModel.find({});
    const dashData={
      doctors:doctors.length,
      appointments:appointments.length,
      patients:users.length,
      latestAppointments:appointments.reverse().slice(0,5)
    }
    res.json({success:true,dashData})
  } catch (error) {
    console.error("Booking error:", error);
    res.json({ success: false, message: error.message });
  }
}
export  {addDoctor,loginAdmin , allDoctors ,appointmentsAdmin , appointmentCancel,adminDashboard}