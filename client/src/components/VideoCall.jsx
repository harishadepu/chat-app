import React, { useEffect, useRef, useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';
import 'webrtc-adapter';

const VideoCall = ({ isOpen, onClose, callType, caller, receiver }) => {
    const { socket, authUser } = useContext(AuthContext);
    const { selectedUser } = useContext(ChatContext);

    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState('connecting');
    const [peerConnection, setPeerConnection] = useState(null);

    const myVideoRef = useRef();
    const remoteVideoRef = useRef();
    const remoteAudioRef = useRef();

    // Update remote video when stream changes
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log('Updating remote video with stream, video element:', remoteVideoRef.current);
            console.log('Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.log('Remote video play failed:', e));
        }
    }, [remoteStream]);

    // Initialize call when component opens
    useEffect(() => {
        if (isOpen && callType) {
            console.log('Call component opened, initializing call');
            initializeCall();
        }

        return () => {
            cleanup();
        };
    }, [isOpen, callType]);

    const initializeCall = async () => {
        try {
            console.log('Initializing call, type:', callType);

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }

            // Get user media
            const constraints = {
                video: callType === 'video' ? { width: 640, height: 480 } : false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            console.log('Requesting media with constraints:', constraints);

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('Got media stream:', mediaStream);
            console.log('Stream tracks:', mediaStream.getTracks().map(track => ({ kind: track.kind, enabled: track.enabled, readyState: track.readyState })));
            setStream(mediaStream);

            if (myVideoRef.current) {
                myVideoRef.current.srcObject = mediaStream;
                myVideoRef.current.play().catch(e => console.log('Local video play failed:', e));
                console.log('Set local video stream');
            }

            // Create RTCPeerConnection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ]
            });

            setPeerConnection(pc);

            // Add local stream to peer connection
            mediaStream.getTracks().forEach(track => {
                console.log('Adding track to peer connection:', track.kind);
                pc.addTrack(track, mediaStream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('Received remote track:', event.track.kind, 'enabled:', event.track.enabled);
                console.log('Remote streams:', event.streams);
                console.log('Stream tracks:', event.streams[0]?.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
                const remoteStream = event.streams[0];
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;                    remoteVideoRef.current.volume = 1; // Ensure volume is up                    // Try to play the video
                    remoteVideoRef.current.play().catch(e => console.log('Auto-play failed:', e));
                    console.log('Set remote video stream and attempted to play');
                }
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.volume = 1;
                    remoteAudioRef.current.play().catch(e => console.log('Remote audio play failed:', e));
                }
                setCallStatus('connected');
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    socket.emit('call-signal', {
                        signal: { candidate: event.candidate },
                        callerId: caller._id,
                        receiverId: receiver._id,
                        callType,
                        from: authUser._id
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('Connection state changed to:', pc.connectionState);
                console.log('ICE connection state:', pc.iceConnectionState);
                console.log('ICE gathering state:', pc.iceGatheringState);
                if (pc.connectionState === 'connected') {
                    console.log('Peer connection established successfully!');
                    setCallStatus('connected');
                } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    console.log('Peer connection failed or disconnected');
                    setCallStatus('error');
                    onClose();
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state changed to:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    console.log('ICE connection established successfully');
                } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                    console.log('ICE connection failed');
                    setCallStatus('error');
                }
            };

            pc.onicegatheringstatechange = () => {
                console.log('ICE gathering state changed to:', pc.iceGatheringState);
            };

            // Add connection timeout
            setTimeout(() => {
                if (callStatus !== 'connected') {
                    console.log('Call connection timeout - closing call');
                    setCallStatus('error');
                    setTimeout(() => onClose(), 2000);
                }
            }, 30000); // 30 second timeout

            // If we're the caller, create offer
            if (caller._id === authUser._id) {
                console.log('Creating offer as caller');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log('Offer created and set as local description');

                socket.emit('call-signal', {
                    signal: { offer: pc.localDescription },
                    callerId: caller._id,
                    receiverId: receiver._id,
                    callType,
                    from: authUser._id
                });
                console.log('Offer sent to server');
            }

        } catch (error) {
            console.error('Error initializing call:', error);
            if (error.name === 'NotAllowedError') {
                alert('Camera and microphone access denied. Please allow access to make video calls.');
            } else if (error.name === 'NotFoundError') {
                alert('No camera or microphone found. Please connect a camera and microphone.');
            } else {
                alert('Failed to start call: ' + error.message);
            }
            setCallStatus('error');
            onClose();
        }
    };

    const cleanup = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        setStream(null);
        setRemoteStream(null);
        setPeerConnection(null);
    };

    const handleSignal = (signalData) => {
        console.log('Received call signal:', signalData);
        // Only handle signals that are relevant to this call
        if ((signalData.callerId === caller._id && signalData.receiverId === receiver._id) ||
            (signalData.callerId === receiver._id && signalData.receiverId === caller._id)) {

            if (peerConnection && signalData.signal) {
                console.log('Processing signal:', signalData.signal);
                if (signalData.signal.offer) {
                    // Handle incoming offer
                    console.log('Handling offer');
                    peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.signal.offer))
                        .then(async () => {
                            console.log('Remote description set, creating answer');
                            const answer = await peerConnection.createAnswer();
                            await peerConnection.setLocalDescription(answer);
                            console.log('Answer created and set as local description');

                            socket.emit('call-signal', {
                                signal: { answer: peerConnection.localDescription },
                                callerId: signalData.callerId,
                                receiverId: signalData.receiverId,
                                callType: signalData.callType,
                                from: authUser._id
                            });
                            console.log('Answer sent to server');
                        })
                        .catch(error => console.error('Error handling offer:', error));
                } else if (signalData.signal.answer) {
                    // Handle incoming answer
                    console.log('Handling answer');
                    peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.signal.answer))
                        .then(() => console.log('Remote answer set successfully'))
                        .catch(error => console.error('Error handling answer:', error));
                } else if (signalData.signal.candidate) {
                    // Handle ICE candidate
                    console.log('Handling ICE candidate');
                    peerConnection.addIceCandidate(new RTCIceCandidate(signalData.signal.candidate))
                        .then(() => console.log('ICE candidate added successfully'))
                        .catch(error => console.error('Error adding ICE candidate:', error));
                }
            }
        }
    };

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream && callType === 'video') {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        socket.emit('end-call', {
            callerId: caller._id,
            receiverId: receiver._id
        });
        cleanup();
        onClose();
    };

    const testMediaAccess = async () => {
        try {
            console.log('Testing media access...');
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: callType === 'video',
                audio: true
            });
            console.log('Media access test successful:', testStream.getTracks().length, 'tracks');
            testStream.getTracks().forEach(track => track.stop());
            alert('Media access test passed! Camera and microphone are working.');
        } catch (error) {
            console.error('Media access test failed:', error);
            alert('Media access test failed: ' + error.message);
        }
    };

    // Listen for call signals
    useEffect(() => {
        if (socket) {
            socket.on('call-signal', handleSignal);
            socket.on('call-ended', () => {
                cleanup();
                onClose();
            });

            return () => {
                socket.off('call-signal', handleSignal);
                socket.off('call-ended');
            };
        }
    }, [socket]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-4xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-semibold">
                        {callType === 'video' ? 'Video Call' : 'Voice Call'} with {selectedUser?.fullName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                        callStatus === 'connected' ? 'bg-green-500 text-white' :
                        callStatus === 'connecting' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                    }`}>
                        {callStatus}
                    </span>
                </div>

                <div className="relative">
                    {callType === 'video' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Remote video */}
                            <div className="relative">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-64 bg-gray-800 rounded-lg"
                                />
                                <audio
                                    ref={remoteAudioRef}
                                    autoPlay
                                    style={{ display: 'none' }}
                                />
                                {!remoteStream && (
                                    <div className="absolute inset-0 flex items-center justify-center text-white">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <span className="text-2xl">{selectedUser?.fullName?.charAt(0)}</span>
                                            </div>
                                            <p>Waiting for connection...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Local video */}
                            <div className="relative">
                                <video
                                    ref={myVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-64 bg-gray-800 rounded-lg object-cover"
                                />
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                    You
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Voice call interface */
                        <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg">
                            <audio
                                ref={remoteAudioRef}
                                autoPlay
                                style={{ display: 'none' }}
                            />
                            <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl text-white">{selectedUser?.fullName?.charAt(0)}</span>
                            </div>
                            <p className="text-white text-xl mb-2">{selectedUser?.fullName}</p>
                            <p className="text-gray-400">{callStatus === 'connected' ? 'Connected' : 'Connecting...'}</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={testMediaAccess}
                        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
                    >
                        Test Media
                    </button>

                    <button
                        onClick={toggleMute}
                        className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} text-white hover:bg-opacity-80`}
                    >
                        {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                    </button>

                    {callType === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-600'} text-white hover:bg-opacity-80`}
                        >
                            {isVideoOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                        </button>
                    )}

                    <button
                        onClick={endCall}
                        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                        <FiPhoneOff size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;