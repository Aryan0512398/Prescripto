import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* Left */}
        <div>
            <img className="mb-5 w-40" src={assets.logo} alt="" />
            <p className="w-full md:w-2/3 text-gray-600 leading-6">Prescripto is your trusted platform for booking doctor appointments with ease. From general checkups to specialist consultations, we connect you with verified healthcare professionals near you. Book appointments, get reminders, and manage your health—all in one place.</p>
        </div>
        {/* Center */}
        <div>
            <p className="text-xl font-medium mb-5">COMPANY</p>
            <ul className="flex flex-col gap-2 text-gray-600">
                <li>Home</li>
                <li>About Us</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
            </ul>
        </div>
        {/* Right */}
        <div>
        <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
            <ul className="flex flex-col gap-2 text-gray-600">
                <li>+917249937912</li>
                <li>aryangupta052015@gmail.com</li>
            </ul>
        </div>
      </div>
      {/* Copy Right text */}
      <div>
        <hr />
        <p className="py-5 text-center text-sm">Copyright © 2025 Prescripto - All Right Reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
