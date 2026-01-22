import React, { useEffect, useRef } from 'react'
import { formatMessageTime } from '../lib/utilis';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import assets from '../assets/assets';
import { FiPhone, FiVideo } from 'react-icons/fi';
import VideoCall from './VideoCall';


const Message = () => {
    const {messages, selectedUser, setSelectedUser, 
        sendMessage, getMessages} = useContext(ChatContext);

    const {authUser,onlineUsers, socket} = useContext(AuthContext);

    const scrollEnd = useRef();

    const [input, setInput] = useState("")
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [callType, setCallType] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);

    const handleSendMessage =async(e)=>{
        e.preventDefault();
        if(input.trim() === "") return null;
        await sendMessage({text: input.trim()});
        setInput("")
    }

    // handle send image 
    const handleSendImage = async(e)=>{
        const file = e.target.files[0];
        if(!file || !file.type.startsWith("image/")){
            toast.error("select  an image file");
            return;
        }
        const reader = new FileReader();

        reader.onloadend = async ()=>{
            await sendMessage({image:reader.result});
            e.target.value = ""
        }
        reader.readAsDataURL(file);
    }

    const onVoiceCall = ()=>{
        if (!selectedUser) return;
        console.log('Initiating voice call to:', selectedUser._id);
        socket.emit('incoming-call', {
            callerId: authUser._id,
            receiverId: selectedUser._id,
            callType: 'audio'
        });
        // Don't open call interface immediately - wait for acceptance
        toast.success('Calling...');
    }

    const onVideoCall = ()=>{
        if (!selectedUser) return;
        console.log('Initiating video call to:', selectedUser._id);
        socket.emit('incoming-call', {
            callerId: authUser._id,
            receiverId: selectedUser._id,
            callType: 'video'
        });
        // Don't open call interface immediately - wait for acceptance
        toast.success('Calling...');
    }

    const handleCloseCall = () => {
        setIsCallOpen(false);
        setCallType(null);
        setIncomingCall(null);
    }

    // Listen for incoming calls
    useEffect(() => {
        if (socket) {
            const handleIncomingCall = (data) => {
                console.log('Received incoming call:', data);
                if (data.receiverId === authUser._id) {
                    setIncomingCall(data);
                    setCallType(data.callType);
                }
            };

            const handleCallAccepted = (data) => {
                console.log('Call accepted:', data);
                if (data.callerId === authUser._id || data.receiverId === authUser._id) {
                    setCallType(data.callType);
                    setIsCallOpen(true);
                }
            };

            const handleCallRejected = (data) => {
                console.log('Call rejected:', data);
                if (data.callerId === authUser._id) {
                    toast.error('Call rejected');
                }
            };

            const handleCallEnded = (data) => {
                console.log('Call ended:', data);
                if (data.callerId === authUser._id || data.receiverId === authUser._id) {
                    handleCloseCall();
                    toast.info('Call ended');
                }
            };

            socket.on('incoming-call', handleIncomingCall);
            socket.on('call-accepted', handleCallAccepted);
            socket.on('call-rejected', handleCallRejected);
            socket.on('call-ended', handleCallEnded);

            return () => {
                socket.off('incoming-call', handleIncomingCall);
                socket.off('call-accepted', handleCallAccepted);
                socket.off('call-rejected', handleCallRejected);
                socket.off('call-ended', handleCallEnded);
            };
        }
    }, [socket, authUser]);

    const acceptCall = () => {
        if (incomingCall) {
            console.log('Accepting call:', incomingCall);
            socket.emit('accept-call', {
                callerId: incomingCall.callerId,
                receiverId: incomingCall.receiverId,
                callType: incomingCall.callType
            });
            setIncomingCall(null);
            setIsCallOpen(true);
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            socket.emit('reject-call', {
                callerId: incomingCall.callerId,
                receiverId: incomingCall.receiverId
            });
            setIncomingCall(null);
        }
    };

    useEffect(()=>{
        if(selectedUser){
            getMessages(selectedUser._id);
        }
    },[selectedUser])

    useEffect(()=>{
        if(scrollEnd.current && messages){
            scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
        }
    },[messages])
  return (
    <>
        {incomingCall && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiPhone className="text-white" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Incoming {incomingCall.callType} call</h3>
                        <p className="text-gray-600 mb-6">From {incomingCall.callerName}</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={rejectCall}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Reject
                            </button>
                            <button
                                onClick={acceptCall}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <VideoCall
            isOpen={isCallOpen}
            onClose={handleCloseCall}
            callType={callType}
            caller={incomingCall ? { _id: incomingCall.callerId, fullName: incomingCall.callerName } : authUser}
            receiver={incomingCall ? authUser : selectedUser}
        />

        {selectedUser ? (
            <div className='h-full overflow-scroll relative background-blur-lg'>
                <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
                    <img src={selectedUser.profilePic || assets.avatar_icon} alt='' className='w-8 rounded-full'/>
                    <p className='flex-1 text-lg text-white flex items-center gap-2'>
                       {selectedUser.fullName}
                        {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
                    </p>
                    <img onClick={()=>{setSelectedUser(null)}} src={assets.arrow_icon} alt='arrow' className='md:hidden max-w-7'/>
                    <FiPhone onClick={onVoiceCall} className='text-white w-5 h-5 cursor-pointer hover:text-blue-400' />
                    <FiVideo onClick={onVideoCall} className='text-white w-5 h-5 cursor-pointer hover:text-blue-400' />
                    <img src={assets.help_icon} alt='help' className='max-w-5 max-md:hidden'/>
                </div>
                {/* messages */}
                <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                    {messages.map((msg,index)=>(
                        <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
                            {msg.image?(
                                <img src={msg.image} alt='image' 
                                className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />)
                                :
                                (<p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg 
                                    mb-8 break-all bg-violet-500/30 text-white 
                                ${msg.senderId === authUser._id ? 'rounded-br-none':'rounded-bl-none'}`}>{msg.text}</p>)}
                                <div className='text-center text-xs'>
                                    <img src={msg.senderId === authUser._id ? authUser?.
                                    profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon } 
                                    alt='avatar' className='w-7 rounded-full'/>
                                    <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
                                </div>
                        </div>
                    ))
                    }
                    <div ref={scrollEnd}></div>
                </div>
                {/* bottom */}
                <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
                    <div className='flex flex-1 items-center bg-gray-100/12 px-3 rounded-full'>
                        <input onChange={(e)=>{setInput(e.target.value)}} value={input} 
                        onKeyDown={(e)=>e.key === "Enter" ? handleSendMessage(e): null} type='text' 
                        placeholder='Type a message...' 
                        className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'/>
                        <input type='file' onChange={handleSendImage} accept='image/png, image/jpeg' hidden id='image'/>
                        <label htmlFor='image' >
                            <img src={assets.gallery_icon} alt='upload' className='w-5 mr-2 cursor-pointer'/>
                        </label>
                    </div>
                    <img src={assets.send_button} onClick={handleSendMessage}  alt='send' className='w-7 cursor-pointer' />
                </div>
            </div>
        ) : (
            <div className='flex flex-col items-center justify-center h-full gap-2 text-gray-500 bg-white/10 max-md:hidden'>
                <img src={assets.logo_icon} alt='logo' className='max-w-16'/>
                <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
            </div>
        )}
    </>
  )
}

export default Message
