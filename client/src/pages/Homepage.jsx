import React, { useContext } from 'react';
import LeftSide from '../components/LeftSide';
import Message from '../components/Message';
import RightSide from '../components/RightSide';

import logo from '../assets/logo_icon.svg'
import { ChatContext } from '../context/ChatContext';

const Homepage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className='border-gray-600 w-full h-screen sm:px-[15%] sm:py-[5%]'>
      <div
        className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full grid relative ${
          selectedUser
            ? 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
     
        <LeftSide />

        {selectedUser ?  (
          <>
            <Message />
            <RightSide />
          </>
        ): <div className='flex flex-col justify-center items-center h-full gap-3'>
          <img className='h-50 w-40 flex item-center flex justify-center' src={logo} alt='logo'/>
          <h1 className='text-2xl text-white font-bold '>Chat here anytime anywhere!</h1>
          </div>}
      </div>
    </div>
  );
};

export default Homepage;