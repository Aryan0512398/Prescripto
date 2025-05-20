import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
// API register
const registerUser = async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body); // 👈 Add this
    const { name, email, password } = req.body;
    if (!name || !password || !email) {
      return res.json({ success: false, message: "Missing Details" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid mail" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }
    // Hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };
    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// API to get user data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// APi to update userprofile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;
    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data is Missing" });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (imageFile) {
      // Upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }
    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // Check if slot is already booked in appointments collection (not just doctor slots_booked)
    const existingAppointment = await appointmentModel.findOne({
      docId,
      slotDate,
      slotTime,
      cancelled: false, // Only count active appointments
    });

    if (existingAppointment) {
      return res.json({ success: false, message: "Slot not available" });
    }

    // Fetch doctor data
    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData || !docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    // Initialize slots_booked or fallback
    let slots_booked = docData.slots_booked || {};
    if (!Array.isArray(slots_booked[slotDate])) {
      slots_booked[slotDate] = [];
    }
    slots_booked[slotDate].push(slotTime);

    // Save slots_booked in doctor doc
    docData.slots_booked = slots_booked;
    await docData.save();

    // Get user data
    const userData = await userModel.findById(userId).select("-password");

    // Clean docData for appointment creation
    const { slots_booked: _, ...docInfo } = docData.toObject();

    // Create new appointment
    const appointmentData = {
      userId,
      docId,
      userData,
      docData: docInfo,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
      cancelled: false,
      payment: false,
      isCompleted: false,
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.error("Booking error:", error);
    res.json({ success: false, message: error.message });
  }
};
// API to get user appointment for frontend my appointment page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Booking error:", error);
    res.json({ success: false, message: error.message });
  }
};
// API to cancel Appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify appointment user
    if (appointmentData.userId.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized Action" });
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
// API for payment
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const paymentRazorPay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }
    // Creating option for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };
    const order = await razorpayInstance.orders.create(options);
    console.log("dcniindc")
    res.json({ success: true, order });
  } catch (error) {
     console.error("Booking error:", error);
    res.json({ success: false, message: error.message });
  }
};
// API to verify payment of razorpay
const verifyRazorpay=async(req,res)=>{
    try {
        const {razorpay_order_id}=req.body;
        const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)
        console.log(orderInfo)
        if(orderInfo.status==="paid"){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            res.json({success:true,message:"Payment Successful"})
        }
        else{
            res.json({success:false,message:"Payment Failed"})
        }
    } catch (error) {
        console.error("Booking error:", error);
        res.json({ success: false, message: error.message });
    }
}
export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorPay,
  verifyRazorpay
};
