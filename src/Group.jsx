import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db } from './firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Picker } from 'emoji-mart';
import { useDropzone } from 'react-dropzone';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VideoCall from './VideoCall';
import { containsProhibitedContent } from './utils';

const Group = () => {
  const { groupId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [group, setGroup] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [warning, setWarning] = useState('');

  // Fetch group info
  useEffect(() => {
    if (!groupId) return;
    const groupRef = doc(db, 'groups', groupId);
    const unsub = onSnapshot(groupRef, (snap) => {
      setGroup({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, [groupId]);


  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnap = await getDoc(doc(db, 'users', user.uid));
      if (!usersSnap.exists()) return;
      const usersCol = collection(db, 'users');
      const q = query(usersCol);
      const snap = await onSnapshot(q, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => snap();
    };
    fetchUsers();
  }, [user.uid]);


  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    setWarning('');
    if (!message.trim() || !user) return;
    if (containsProhibitedContent(message)) {
      setWarning('Prohibited content detected! Message not sent. Admins have been notified.');
     
      if (group && group.admins) {
        await addDoc(collection(db, 'groups', groupId, 'messages'), {
          text: `Warning: Prohibited content was attempted by ${user.email}`,
          sender: 'System',
          uid: 'system',
          timestamp: serverTimestamp(),
        });
      }
      return;
    }
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
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

  // Mark view-once messages as viewed
  useEffect(() => {
    if (!user) return;
    messages.forEach(async (msg) => {
      if (msg.viewOnce && msg.uid !== user.uid && !(msg.viewedBy || []).includes(user.uid)) {
        const msgRef = doc(db, 'groups', groupId, 'messages', msg.id);
        await updateDoc(msgRef, {
          viewedBy: arrayUnion(user.uid)
        });
      }
    });
  }, [messages, user, groupId]);

  // Admin actions
  const isAdmin = group && group.admins && group.admins.includes(user.uid);

  const handleAddMember = async (uid) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(uid)
    });
  };

  const handleRemoveMember = async (uid) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(uid),
      admins: arrayRemove(uid)
    });
  };

  const handlePromoteAdmin = async (uid) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      admins: arrayUnion(uid)
    });
  };

  const handleDemoteAdmin = async (uid) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      admins: arrayRemove(uid)
    });
  };

  // Group link for sharing
  const groupLink = `${window.location.origin}/group/${groupId}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(groupLink);
    alert('Group link copied!');
  };

  // Emoji picker
  const addEmoji = (e) => {
    setMessage(message + e.native);
    setShowEmoji(false);
  };

  // File upload
  const onDrop = async (acceptedFiles) => {
    if (!user || !groupId || acceptedFiles.length === 0) return;
    setUploading(true);
    const file = acceptedFiles[0];
    const fileRef = ref(storage, `groups/${groupId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
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
      <h2>Group Chat</h2>
      <button onClick={() => setShowVideoCall(true)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 20 }}>Video Call</button>
      {showVideoCall && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, minWidth: 400 }}>
            <VideoCall initiator={true} onEnd={() => setShowVideoCall(false)} />
          </div>
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: '#888' }}>Share this group link:</span>
        <input value={groupLink} readOnly style={{ width: '70%', marginLeft: 8, marginRight: 8 }} />
        <button onClick={handleCopyLink}>Copy</button>
      </div>
      {group && (
        <div style={{ marginBottom: 20 }}>
          <strong>Group Name:</strong> {group.name}<br />
          <strong>Members:</strong>
          <ul>
            {group.members && group.members.map(uid => {
              const member = allUsers.find(u => u.id === uid);
              return (
                <li key={uid}>
                  {member ? member.email : uid}
                  {isAdmin && uid !== user.uid && (
                    <>
                      <button style={{ marginLeft: 8 }} onClick={() => handleRemoveMember(uid)}>Remove</button>
                      {group.admins && !group.admins.includes(uid) && (
                        <button style={{ marginLeft: 8 }} onClick={() => handlePromoteAdmin(uid)}>Promote to Admin</button>
                      )}
                      {group.admins && group.admins.includes(uid) && (
                        <button style={{ marginLeft: 8 }} onClick={() => handleDemoteAdmin(uid)}>Demote Admin</button>
                      )}
                    </>
                  )}
                  {group.admins && group.admins.includes(uid) && <span style={{ marginLeft: 8, color: 'green' }}>(Admin)</span>}
                </li>
              );
            })}
          </ul>
          {isAdmin && (
            <div>
              <strong>Add Member:</strong>
              <ul>
                {allUsers.filter(u => !group.members.includes(u.id)).map(u => (
                  <li key={u.id}>
                    {u.email}
                    <button style={{ marginLeft: 8 }} onClick={() => handleAddMember(u.id)}>Add</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
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
                <span style={{ background: '#e0f7fa', padding: '6px 12px', borderRadius: 16 }}>{displayText}</span>
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

export default Group; 