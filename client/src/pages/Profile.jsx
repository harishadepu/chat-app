import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {

    const {authUser, updateProfile} = useContext(AuthContext);


    const [selectImage, setSelectImage] = useState(null);
    const navigate = useNavigate();
    const [name,setName] = useState(authUser.fullName);
    const [bio,setBio] = useState(authUser.bio);

    const handleSubmit =async(e)=>{
        e.preventDefault();
        if(!selectImage){
            await updateProfile({fullName: name, bio});
            navigate('/');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(selectImage);
        reader.onload = async()=>{

            const base64Image = reader.result;
            await updateProfile({profilePic:base64Image, fullName:name, bio});
            navigate('/');
        }
       
    }
  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
        <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 
        flex items-center
        justify-between max-sm:flex-col-reverse rounded-lg'>
            <form onSubmit={handleSubmit} className='p-10 flex flex-col gap-5 flex-1'>
                <h3 className='text-lg'>Profile details</h3>
                <label htmlFor='avator' className='flex items-center gap-3 cursor-pointer'>
                    <input type='file' onChange={(e)=>setSelectImage(e.target.files[0])} id='avator' accept='.png, .jpg, .jpeg' 
                    hidden />
                <img src={selectImage ? URL.createObjectURL(selectImage) : assets.avatar_icon} alt=''
                className= {`w-12 h-12 ${selectImage && 'rounded-full'}`} /> upload profile image</label>
                <input onChange={(e)=>{setName(e.target.value)}} value={name} type='text' placeholder='your name' className='p-2 border border-gray-500 rounded-md foucus:ring-violet-500' required/>
                <textarea placeholder='write profile bio' required onChange={(e)=>{setBio(e.target.value)}} value={bio}
                className='p-2 border border-gray-500 rounded-md focus:outline-none foucus:ring-2 focus:ring-violet-500' rows={4}></textarea>
                <button type='submit' className='bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer'>Save</button>
            </form>
            <img src={authUser?.profilePic || assets.logo_icon} alt='logo' 
            className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectImage && 'rounded-full'}`}/>
        </div>

    </div>
  )
}

export default Profile