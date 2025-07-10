import React, { useContext, useEffect, useState } from 'react'
import logo from '../assets/logo_big.svg'
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';

const Loginpage = () => {
  
    const [currState,setCurrState] = useState('SignUp');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const {login,authUser} = useContext(AuthContext)

    const navigate = useNavigate();

    useEffect(()=>{
        if(authUser){
            navigate('/')
        }
    },[authUser,navigate])


    const onSubmitHandler = (e) => {
        e.preventDefault();
        if (currState === "SignUp" && !isDataSubmitted) {
            setIsDataSubmitted(true);
            return;
        }
        login(currState === "SignUp" ? "signup" : "login", {fullName,email,password,bio})
    }
  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
        <img src={logo} alt='logo' className='w-[min(30vw,250px)]'/>
        <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
            <h1 className='font-medium text-2xl flex justify-between items-center'>{currState}
                {isDataSubmitted && <img onClick={()=>{setIsDataSubmitted(false)}} src={assets.arrow_icon} alt='arrow' className='inline-block w-5 cursor-pointer ml-2'/>}
                
            </h1>
            {currState === "SignUp" && !isDataSubmitted && (
                 <input onChange={(e)=>{setFullName(e.target.value)}} value={fullName} className='p-2 border border-gray-500 rounded-md focus:outline-none'  type="text" placeholder='Full name' id='name' required />
            )}
            { !isDataSubmitted && (
                <><input onChange={(e)=>{setEmail(e.target.value)}} value={email} className='p-2 border border-gray-500 rounded-md focus:outline-none' type="text" placeholder='Email' required />
                <input onChange={(e)=>{setPassword(e.target.value)}} value={password} className='p-2 border border-gray-500 rounded-md focus:outline-none' type="text" placeholder='password' required /></>
                
            )}
            {currState === "SignUp" && isDataSubmitted && (
                <textarea onChange={(e)=>{setBio(e.target.value)}} value={bio} className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder='provide a short bio...' rows='3' required />
            )}

            <button className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer' type='submit'>{currState === "SignUp" ? "Creat Account": "Login Now"}</button>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
                <input type='checkbox' id='remember' className='mr-2 accent-violet-500' />
                <p>Agree to the terms of use & privacy policy.</p>
            </div>
            <div className='flex flex-col gap-2'>
                {currState === "SignUp" ? (
                    <p className='text-sm text-gray-600'>Already have an account? <span onClick={()=>{setCurrState("Login"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
                ):(
                    <p className='text-sm text-gray-600'>Create an account <span onClick={()=>{setCurrState("SignUp")}} className='font-medium text-violet-500 cursor-pointer'>Click here</span></p>
                )
                    }
            </div>

        </form>
    </div>
  )
}

export default Loginpage