import React, { useRef, useState } from 'react';
import Peer from 'simple-peer';

const VideoCall = ({ initiator, onEnd }) => {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const myVideo = useRef();
  const userVideo = useRef();
  const [signal, setSignal] = useState('');
  const [remoteSignal, setRemoteSignal] = useState('');

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
    });
  }, []);

  const startCall = () => {
    const p = new Peer({ initiator: true, trickle: false, stream });
    p.on('signal', data => setSignal(JSON.stringify(data)));
    p.on('stream', userStream => {
      if (userVideo.current) userVideo.current.srcObject = userStream;
    });
    setPeer(p);
  };

  const joinCall = () => {
    const p = new Peer({ initiator: false, trickle: false, stream });
    p.on('signal', data => setSignal(JSON.stringify(data)));
    p.on('stream', userStream => {
      if (userVideo.current) userVideo.current.srcObject = userStream;
    });
    setPeer(p);
    if (remoteSignal) {
      p.signal(JSON.parse(remoteSignal));
    }
  };

  const handleSignal = () => {
    if (peer && remoteSignal) {
      peer.signal(JSON.parse(remoteSignal));
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Video Call</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
        <div>
          <video ref={myVideo} autoPlay muted playsInline style={{ width: 200, borderRadius: 8, background: '#222' }} />
          <div>Me</div>
        </div>
        <div>
          <video ref={userVideo} autoPlay playsInline style={{ width: 200, borderRadius: 8, background: '#222' }} />
          <div>Remote</div>
        </div>
      </div>
      <div style={{ margin: '20px 0' }}>
        {initiator ? (
          <>
            <button onClick={startCall}>Start Call</button>
            <div>
              <textarea value={signal} readOnly rows={3} style={{ width: 300 }} />
              <div>Share this signal with the other user</div>
            </div>
            <div>
              <input
                type="text"
                value={remoteSignal}
                onChange={e => setRemoteSignal(e.target.value)}
                placeholder="Paste remote signal here"
                style={{ width: 300 }}
              />
              <button onClick={handleSignal}>Connect</button>
            </div>
          </>
        ) : (
          <>
            <button onClick={joinCall}>Join Call</button>
            <div>
              <input
                type="text"
                value={remoteSignal}
                onChange={e => setRemoteSignal(e.target.value)}
                placeholder="Paste initiator signal here"
                style={{ width: 300 }}
              />
              <button onClick={handleSignal}>Connect</button>
            </div>
            <div>
              <textarea value={signal} readOnly rows={3} style={{ width: 300 }} />
              <div>Share this signal with the initiator</div>
            </div>
          </>
        )}
      </div>
      <button onClick={onEnd}>End Call</button>
    </div>
  );
};

export default VideoCall; 