import React, { useContext, useState } from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import AllApointments from './pages/Admin/AllApointments.jsx';
import AddDoctor from './pages/Admin/AddDoctor.jsx';
import DoctorsList from './pages/Admin/DoctorsList.jsx'
import Dashboard from './pages/Admin/Dashboard.jsx'
import { Route, Routes } from 'react-router-dom';
import { DoctorContext } from './context/DoctorContext.jsx';
import DoctorDashboard from './pages/Doctor/DoctorDashboard.jsx';
import DoctorAppointments from './pages/Doctor/DoctorAppointments.jsx';
import DoctorProfile from './pages/Doctor/DoctorProfile.jsx';
const App = () => {
  const {aToken}=useContext(AdminContext)
  const {dToken}=useContext(DoctorContext)
  return aToken || dToken ?  (
    <div className='bg-[#F8F9FD]' >
      <ToastContainer></ToastContainer>
      <Navbar></Navbar>
      <div className='flex items-start'>
        <Sidebar>
        </Sidebar>
        <Routes>
          {/* Admin Route */}
          <Route path='/' element={<></>}></Route>
          <Route path='/admin-dashboard' element={<Dashboard></Dashboard>}></Route>
          <Route path='/all-appointments' element={<AllApointments></AllApointments>}></Route>
          <Route path='/add-doctor' element={<AddDoctor></AddDoctor>}></Route>
          <Route path='/doctor-list' element={<DoctorsList></DoctorsList>}></Route>
           {/* Doctor Routes */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard></DoctorDashboard>}></Route>
          <Route path='/doctor-appointments' element={<DoctorAppointments></DoctorAppointments>}></Route>
          <Route path='/doctor-profile' element={<DoctorProfile></DoctorProfile>}></Route>

        </Routes>
      </div>
    </div>
  ) :(
    <>
    <Login></Login>
    <ToastContainer></ToastContainer>
    </>
  )
}

export default App
