import React from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'

const LeftSide = () => {

    const {getUsers, users, selectedUser, setSelectedUser,
        unseenMessages, setUnseenMessages} = useContext(ChatContext);
        console.log(selectedUser);

    const {logout,onlineUsers} = useContext(AuthContext);

    const [input, setInput] = useState("")
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [selectedStatusUser, setSelectedStatusUser] = useState(null)

    const navigate = useNavigate();

    const filteredUsers = input ? users.filter((user)=> user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

    useEffect(()=>{
        getUsers();
    },[onlineUsers])

  return (
    <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : "" }`}>
        <div className='pb-5'>
        <div className='flex justify-between items-center'>
            <img src={assets.logo} alt='logo' className='max-w-40'/>
            <div className='relative py-2 group'>
                <img src={assets.menu_icon} alt='menu' className='max-h-5 cursor-pointer'/>
                <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                    <p onClick={()=>{navigate('/profile')}} className='cursor-pointer text-sm'>Edit profile</p>
                    <hr className='my-2 border-t border-gray-500'/>
                    <p onClick={()=>{logout()}} className='cursor-pointer text-sm'>logout</p>
                </div>
            </div>


        </div>
        <div className='bg-[#282142] rounded-full py-3 px-4 mt-5 flex items-center'>
            <img src={assets.search_icon} alt='search' className='w-3'/>
            <input onChange={(e)=>setInput(e.target.value)} value={input} type='text' className='bg-transparent border-none outline-none text-xs text-white flex-1 placeholder-[#c8c8c8] w-full ml-2' placeholder='Search for users' />
        </div>
    </div>
    <div className='flex flex-col'>
        {filteredUsers.map((user,index)=>(
            <div key={index} onClick={()=>{setSelectedUser(user); setUnseenMessages(prev=>({...prev,[user._id]:0}))}}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer
             max-sm:text:sm ${selectedUser?._id === user._id && 'bg-[#282142]/50'}`}>
                <img src={user?.profilePic || assets.avatar_icon} alt=''
                className='w-[35px] aspect-[1/1] rounded-full'/>
                <div className='flex flex-col leading-5'>
                    <p>{user.fullName}</p>
                    {
                        user.status?.text || user.status?.video || user.status?.photo ? (
                            <span className='text-yellow-400 text-xs cursor-pointer' onClick={()=>{setSelectedStatusUser(user); setShowStatusModal(true)}}>
                                {user.status.text || "Status"} {user.status.photo && "(Photo)"} {user.status.video && "(Video)"}
                            </span>
                        ) : (
                            onlineUsers.includes(user._id) ? <span className='text-green-400 text-xs'>Online</span> 
                            :
                             <span className='text-neutral-400 text-xs'>Offline</span>
                        )
                    }
                </div>
                {unseenMessages[user._id] > 0 && <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center
                 items-center rounded-full bg-violet-500/50'>{unseenMessages[user._id]}</p>}
            </div>
        ))}

    </div>

    {showStatusModal && selectedStatusUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-[#282142] p-5 rounded-lg max-w-md w-full mx-4'>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-white text-lg'>{selectedStatusUser.fullName}'s Status</h3>
                    <button onClick={()=>{setShowStatusModal(false); setSelectedStatusUser(null)}} className='text-white text-xl'>×</button>
                </div>
                {selectedStatusUser.status.text && <p className='text-white mb-4'>{selectedStatusUser.status.text}</p>}
                {selectedStatusUser.status.photo && <img src={selectedStatusUser.status.photo} alt='Status photo' className='w-full h-auto rounded mb-4' />}
                {selectedStatusUser.status.video && <video src={selectedStatusUser.status.video} controls className='w-full h-auto rounded' />}
            </div>
        </div>
    )}
    
    </div>
    
  )
}

export default LeftSide
