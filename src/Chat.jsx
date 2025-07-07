import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Picker } from 'emoji-mart';
import { useDropzone } from 'react-dropzone';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VideoCall from './VideoCall';
import { containsProhibitedContent } from './utils';

const Chat = () => {
  const { chatId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [warning, setWarning] = useState('');

 
  const chatLink = `${window.location.origin}/chat/${chatId}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(chatLink);
    alert('Chat link copied!');
  };

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    setWarning('');
    if (!message.trim() || !user) return;
    if (containsProhibitedContent(message)) {
      setWarning('Prohibited content detected! Message not sent.');
      return;
    }
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: message,
      sender: user.email,
      uid: user.uid,
      timestamp: serverTimestamp(),
      viewOnce,
      viewedBy: [],
    });
    setMessage('');
    setViewOnce(false);
  };

 
  useEffect(() => {
    if (!user) return;
    messages.forEach(async (msg) => {
      if (msg.viewOnce && msg.uid !== user.uid && !(msg.viewedBy || []).includes(user.uid)) {
        const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
        await updateDoc(msgRef, {
          viewedBy: arrayUnion(user.uid)
        });
      }
    });
  }, [messages, user, chatId]);


  const addEmoji = (e) => {
    setMessage(message + e.native);
    setShowEmoji(false);
  };

 
  const onDrop = async (acceptedFiles) => {
    if (!user || !chatId || acceptedFiles.length === 0) return;
    setUploading(true);
    const file = acceptedFiles[0];
    const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: '',
      fileUrl: url,
      fileName: file.name,
      sender: user.email,
      uid: user.uid,
      timestamp: serverTimestamp(),
    });
    setUploading(false);
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
      <h2>Chat</h2>
      <button onClick={() => setShowVideoCall(true)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 20 }}>Video Call</button>
      {showVideoCall && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, minWidth: 400 }}>
            <VideoCall initiator={true} onEnd={() => setShowVideoCall(false)} />
          </div>
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: '#888' }}>Share this chat link:</span>
        <input value={chatLink} readOnly style={{ width: '70%', marginLeft: 8, marginRight: 8 }} />
        <button onClick={handleCopyLink}>Copy</button>
      </div>
      <div style={{ minHeight: 300, border: '1px solid #ccc', padding: 10, marginBottom: 10, maxHeight: 400, overflowY: 'auto' }}>
        {messages.length === 0 && <div>No messages yet.</div>}
        {messages.map((msg) => {
          let displayText = msg.text;
          if (msg.viewOnce && msg.uid !== user.uid && (msg.viewedBy || []).includes(user.uid)) {
            displayText = '**';
          }
          return (
            <div key={msg.id} style={{ margin: '8px 0', textAlign: msg.uid === user.uid ? 'right' : 'left' }}>
              {msg.fileUrl ? (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginRight: 8 }}>
                  {msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={msg.fileUrl} alt={msg.fileName} style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                  ) : (
                    <span>{msg.fileName || 'File'}</span>
                  )}
                </a>
              ) : (
                <span style={{ background: '#eee', padding: '6px 12px', borderRadius: 16 }}>{displayText}</span>
              )}
              {msg.viewOnce && <span style={{ marginLeft: 6, color: '#f39c12', fontSize: 12 }}>[View Once]</span>}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="button" onClick={() => setShowEmoji(v => !v)} style={{ fontSize: 20 }}>😊</button>
        {showEmoji && (
          <div style={{ position: 'absolute', zIndex: 10, bottom: 60, right: 40 }}>
            <Picker onSelect={addEmoji} theme={document.body.classList.contains('dark-mode') ? 'dark' : 'light'} />
          </div>
        )}
        <div {...getRootProps()} style={{ cursor: 'pointer', marginLeft: 8 }}>
          <input {...getInputProps()} />
          <span role="img" aria-label="attach">📎</span>
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
        <label style={{ marginLeft: 8, fontSize: 14 }}>
          <input type="checkbox" checked={viewOnce} onChange={e => setViewOnce(e.target.checked)} /> View Once
        </label>
      </form>
      {uploading && <div style={{ color: '#888', marginTop: 5 }}>Uploading...</div>}
      {warning && <div style={{ color: 'red', marginBottom: 8 }}>{warning}</div>}
    </div>
  );
};

export default Chat; 