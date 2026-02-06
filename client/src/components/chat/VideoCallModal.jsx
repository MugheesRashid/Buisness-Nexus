import React, { useEffect, useRef, useState } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Peer from 'simple-peer';

// Polyfill for Node.js globals in Vite/React
import { Buffer } from 'buffer';
import process from 'process';

// Polyfill globals for simple-peer
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
}

export const VideoCallModal = ({ isOpen, onClose, callData, onAccept, onReject }) => {
  const { socket, user } = useAuth();
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasLocalMedia, setHasLocalMedia] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [shouldStartPeer, setShouldStartPeer] = useState(false);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const signalBufferRef = useRef([]);
  const callDataRef = useRef(callData);
  const isInitiatorRef = useRef(isInitiator);
  const callStartedRef = useRef(false);
  const callAcceptedRef = useRef(false);

  useEffect(() => {
    if (isOpen && callData) {
      console.log('VideoCallModal opened with callData:', callData);
      const initiator = callData.callerId === user.id;
      setIsInitiator(initiator);
      isInitiatorRef.current = initiator;
      callDataRef.current = callData;
      
      if (initiator) {
        setCallStatus('calling');
        // Initialize media immediately for initiator
        initializeMedia().then(() => {
          console.log('Initiator media initialized');
          setHasLocalMedia(true);
        }).catch(error => {
          console.error('Failed to initialize initiator media:', error);
        });
      } else {
        setCallStatus('incoming');
      }
    }

    return () => {
      cleanup();
    };
  }, [isOpen, callData, user.id]);

  // Handle call accepted event for initiator
  useEffect(() => {
    if (!socket || !callData) return;

    const handleCallAccepted = (data) => {
      console.log('Initiator received callAccepted:', data);
      if (data.callId === callData.callId) {
        callAcceptedRef.current = true;
        setShouldStartPeer(true);
      }
    };

    socket.on('callAccepted', handleCallAccepted);

    return () => {
      socket.off('callAccepted', handleCallAccepted);
    };
  }, [socket, callData]);

  // Handle call started event for receiver
  useEffect(() => {
    if (!socket || !callData) return;

    const handleCallStarted = (data) => {
      console.log('Receiver received callStarted:', data);
      if (data.callId === callData.callId) {
        setCallStarted(true);
        callStartedRef.current = true;
        setShouldStartPeer(true);
      }
    };

    socket.on('callStarted', handleCallStarted);

    return () => {
      socket.off('callStarted', handleCallStarted);
    };
  }, [socket, callData]);

  // Start peer connection when shouldStartPeer is true
  useEffect(() => {
    if (shouldStartPeer && hasLocalMedia && callData) {
      console.log('Starting peer connection, isInitiator:', isInitiator);
      setCallStatus('connecting');
      createPeerConnection(isInitiator);
      setShouldStartPeer(false);
    }
  }, [shouldStartPeer, hasLocalMedia, isInitiator, callData]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket || !callData) return;

    const handleWebRTCSignal = (data) => {
      if (data.callId === callData.callId) {
        console.log('Receiving WebRTC signal:', data.signal.type);
        if (peerRef.current) {
          console.log('Passing signal to existing peer');
          peerRef.current.signal(data.signal);
        } else {
          console.log('Buffering signal, peer not ready yet');
          signalBufferRef.current.push(data.signal);
        }
      }
    };

    socket.on('webrtcSignal', handleWebRTCSignal);

    return () => {
      socket.off('webrtcSignal', handleWebRTCSignal);
    };
  }, [socket, callData]);

  // Handle call ended/missed events
  useEffect(() => {
    if (!socket || !callData) return;

    const handleCallEnded = (data) => {
      if (data && data.callId === callData.callId) {
        console.log('Call ended event received');
        setCallStatus('ended');
        cleanup();
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    };

    const handleCallRejected = (data) => {
      if (data && data.callId === callData.callId) {
        console.log('Call rejected event received');
        setCallStatus('rejected');
        cleanup();
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    };

    const handleCallMissed = (data) => {
      if (data && data.callId === callData.callId) {
        console.log('Call missed event received');
        setCallStatus('missed');
        cleanup();
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    };

    socket.on('callEnded', handleCallEnded);
    socket.on('callRejected', handleCallRejected);
    socket.on('callMissed', handleCallMissed);

    return () => {
      socket.off('callEnded', handleCallEnded);
      socket.off('callRejected', handleCallRejected);
      socket.off('callMissed', handleCallMissed);
    };
  }, [socket, callData, onClose]);

  const initializeMedia = async () => {
    try {
      console.log('Initializing media...');
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 }
        }
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (videoError) {
        console.warn('Video failed, trying audio only:', videoError);
        // Try audio only
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: constraints.audio,
          video: false
        });
      }
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasLocalMedia(true);
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = mediaStream;
        myVideoRef.current.muted = true;
        myVideoRef.current.playsInline = true;
        myVideoRef.current.autoplay = true;
      }
      
      console.log('Media initialized successfully');
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallStatus('error');
      throw error;
    }
  };

  const createPeerConnection = (initiator) => {
    try {
      console.log(`Creating peer connection as ${initiator ? 'initiator' : 'receiver'}`);
      
      if (!streamRef.current) {
        console.error('No stream available for peer connection');
        setCallStatus('error');
        return;
      }

      const peerConfig = {
        initiator: initiator,
        trickle: true,
        stream: streamRef.current,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      };

      const newPeer = new Peer(peerConfig);
      console.log('Peer created successfully');

      newPeer.on('signal', (signalData) => {
        console.log('Emitting WebRTC signal:', signalData.type);
        if (socket && callData) {
          const targetId = initiator ? callData.receiverId : callData.callerId;
          socket.emit('webrtcSignal', {
            callId: callData.callId,
            signal: signalData,
            to: targetId
          });
        }
      });

      newPeer.on('connect', () => {
        console.log('WebRTC peer connection established');
        setIsConnected(true);
        setCallStatus('connected');
      });

      newPeer.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.playsInline = true;
          remoteVideoRef.current.autoplay = true;
        }
      });

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        setCallStatus('error');
      });

      newPeer.on('close', () => {
        console.log('Peer connection closed');
        endCall();
      });

      // Process any buffered signals
      if (signalBufferRef.current.length > 0) {
        console.log('Processing buffered signals:', signalBufferRef.current.length);
        signalBufferRef.current.forEach(signal => {
          try {
            newPeer.signal(signal);
          } catch (err) {
            console.error('Error processing buffered signal:', err);
          }
        });
        signalBufferRef.current = [];
      }

      peerRef.current = newPeer;
      setPeer(newPeer);

    } catch (error) {
      console.error('Error creating peer connection:', error);
      setCallStatus('error');
    }
  };

  const acceptCall = async () => {
    try {
      console.log('Accepting call as receiver');
      
      // Emit accept call to server first
      if (socket && callData) {
        socket.emit('acceptCall', { callId: callData.callId });
      }
      
      if (onAccept) {
        onAccept();
      }
      
      setCallStatus('connecting');
      
      // Initialize media for receiver
      await initializeMedia();
      
      // Wait for callStarted event before creating peer
      // The server will send callStarted after caller receives callAccepted
      
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallStatus('error');
    }
  };

  const endCall = () => {
    console.log('Ending call');
    if (socket && callData) {
      socket.emit('endCall', { callId: callData.callId });
    }
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    console.log('Cleaning up resources');
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (error) {
        console.error('Error destroying peer:', error);
      }
      peerRef.current = null;
    }
    
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (error) {
        console.error('Error stopping tracks:', error);
      }
      streamRef.current = null;
    }
    
    setStream(null);
    setPeer(null);
    setIsConnected(false);
    setHasLocalMedia(false);
    setCallStarted(false);
    setShouldStartPeer(false);
    callAcceptedRef.current = false;
    callStartedRef.current = false;
    
    signalBufferRef.current = [];
  };

  const rejectCall = () => {
    console.log('Rejecting call');
    if (socket && callData) {
      socket.emit('rejectCall', { callId: callData.callId });
    }
    if (onReject) {
      onReject();
    }
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {callStatus === 'incoming' ? 'Incoming Video Call' : 
             callStatus === 'calling' ? 'Calling...' : 
             callStatus === 'connecting' ? 'Connecting...' :
             callStatus === 'connected' ? 'Video Call' : 'Video Call'}
          </h2>
          <button
            onClick={endCall}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local video */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={myVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {(!hasLocalMedia || isVideoOff) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-center">
                  <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </div>
                  <p className="text-sm">{isVideoOff ? 'Camera is off' : 'No camera'}</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
              <span>You</span>
              {isMuted && <span className="ml-1">🔇</span>}
            </div>
          </div>

          {/* Remote video */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {(callStatus === 'calling' || callStatus === 'connecting') && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-center">
                  <div className="animate-pulse bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                    <Phone size={24} />
                  </div>
                  <p className="text-sm">
                    {callStatus === 'calling' ? 'Calling...' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}
            {callStatus === 'connected' && !remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-center">
                  <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                    <Phone size={24} />
                  </div>
                  <p className="text-sm">Waiting for video...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              {callData?.callerId === user.id ? 'Receiver' : 'Caller'}
            </div>
          </div>
        </div>

        {/* Call controls */}
        <div className="flex justify-center mt-6 space-x-4">
          {callStatus === 'incoming' ? (
            <>
              <button
                onClick={acceptCall}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
              >
                <Phone size={20} />
                <span>Accept</span>
              </button>
              <button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
              >
                <PhoneOff size={20} />
                <span>Reject</span>
              </button>
            </>
          ) : callStatus === 'connected' ? (
            <>
              <button
                onClick={toggleMute}
                className={`px-4 py-3 rounded-full flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                onClick={toggleVideo}
                className={`px-4 py-3 rounded-full flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg ${
                  isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                <span>{isVideoOff ? 'Turn On' : 'Turn Off'}</span>
              </button>
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
              >
                <PhoneOff size={20} />
                <span>End Call</span>
              </button>
            </>
          ) : (
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
            >
              <PhoneOff size={20} />
              <span>Cancel Call</span>
            </button>
          )}
        </div>

        {/* Status indicator */}
        <div className="text-center mt-4 text-gray-600 font-medium">
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'incoming' && 'Incoming call...'}
          {callStatus === 'connected' && 'Connected ✓'}
          {callStatus === 'error' && 'Connection error. Please try again.'}
          {callStatus === 'ended' && 'Call ended'}
          {callStatus === 'rejected' && 'Call rejected'}
          {callStatus === 'missed' && 'Call missed'}
        </div>

        {/* Debug info */}
        {!process.env.NODE_ENV && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600 font-mono">
            <div><strong>Call ID:</strong> {callData?.callId}</div>
            <div><strong>Status:</strong> {callStatus}</div>
            <div><strong>Role:</strong> {isInitiator ? 'Caller' : 'Receiver'}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Caller ID:</strong> {callData?.callerId}</div>
            <div><strong>Local Media:</strong> {hasLocalMedia ? '✅' : '❌'}</div>
            <div><strong>Peer Connection:</strong> {peerRef.current ? '✅' : '❌'}</div>
            <div><strong>Connected:</strong> {isConnected ? '✅' : '❌'}</div>
            <div><strong>Call Accepted:</strong> {callAcceptedRef.current ? '✅' : '❌'}</div>
            <div><strong>Call Started:</strong> {callStartedRef.current ? '✅' : '❌'}</div>
            <div><strong>Should Start Peer:</strong> {shouldStartPeer ? '✅' : '❌'}</div>
            <div><strong>Signal Buffer:</strong> {signalBufferRef.current.length} signals</div>
          </div>
        )}
      </div>
    </div>
  );
};