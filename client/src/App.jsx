import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Loginpage from './pages/Loginpage'
import Profile from './pages/Profile'
import {Toaster} from 'react-hot-toast'
import { AuthContext } from './context/AuthContext'

const App = () => {
  const { authUser } = useContext(AuthContext)
  return (
    
   <div className=" bg-contain" style={{background: "black"}}>
    <Toaster/>
    <Routes>
      <Route path='/' element={authUser ? <Homepage/> : <Navigate to="/login"/>}/>
      <Route path='/login' element={!authUser ? <Loginpage/> : <Navigate to="/"/>}/>
      <Route path='/profile' element={authUser ? <Profile/> : <Navigate to="/login"/> }/>
    </Routes>
    </div>
  )
}

export default App