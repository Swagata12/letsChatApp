import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { collection, getDocs, query, where, addDoc, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagged, setTagged] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const navigate = useNavigate();

  // Fetch all users except current
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      setUsers(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user.uid)
      );
    };
    fetchUsers();
  }, [user.uid]);

  // Fetch groups where user is a member
  useEffect(() => {
    const fetchGroups = async () => {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchGroups();
  }, [user.uid]);

  // Ensure user is in users collection
  useEffect(() => {
    const ensureUserDoc = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { email: user.email });
      }
    };
    ensureUserDoc();
  }, [user.uid, user.email]);

  // Fetch tagged friends
  useEffect(() => {
    const fetchTagged = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().tagged) {
        setTagged(userSnap.data().tagged);
      } else {
        setTagged([]);
      }
    };
    fetchTagged();
  }, [user.uid]);

  // Fetch public groups
  useEffect(() => {
    const fetchPublicGroups = async () => {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('public', '==', true));
      const snapshot = await getDocs(q);
      setPublicGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPublicGroups();
  }, []);

  // Tag a friend
  const handleTagFriend = async (friendId) => {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      tagged: arrayUnion(friendId)
    });
    setTagged(prev => [...prev, friendId]);
  };

  // Untag a friend
  const handleUntagFriend = async (friendId) => {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      tagged: arrayRemove(friendId)
    });
    setTagged(prev => prev.filter(id => id !== friendId));
  };

  // Start or go to a chat with another user
  const handleStartChat = async (otherUser) => {
    // Chat ID is a combination of user IDs (sorted)
    const chatId = [user.uid, otherUser.id].sort().join('_');
    // Optionally, create chat doc if not exists
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [user.uid, otherUser.id],
        createdAt: new Date(),
      });
    }
    navigate(`/chat/${chatId}`);
  };

  // Go to a group chat
  const handleGoToGroup = (group) => {
    navigate(`/group/${group.id}`);
  };

  // Create a new group (public or secured)
  const handleCreateGroup = async () => {
    const groupName = prompt('Enter group name:');
    if (!groupName) return;
    const isPublic = window.confirm('Make this group public? (OK = Public, Cancel = Secured)');
    const groupRef = await addDoc(collection(db, 'groups'), {
      name: groupName,
      members: [user.uid],
      admins: [user.uid],
      createdAt: new Date(),
      public: isPublic,
    });
    navigate(`/group/${groupRef.id}`);
  };

  // Join a public group
  const handleJoinPublicGroup = async (group) => {
    const groupRef = doc(db, 'groups', group.id);
    await updateDoc(groupRef, {
      members: arrayUnion(user.uid)
    });
    navigate(`/group/${group.id}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Dashboard</h2>
      <div style={{ margin: '20px 0' }}>
        <strong>Logged in as:</strong>
        <div>{user?.email}</div>
      </div>
      <button onClick={logout} style={{ padding: '10px', width: '100%', marginBottom: 20 }}>
        Logout
      </button>
      <hr />
      <h3>Tagged Friends</h3>
      {tagged.length === 0 ? <div>No tagged friends.</div> : (
        <ul>
          {tagged.map(id => {
            const friend = users.find(u => u.id === id);
            if (!friend) return null;
            return (
              <li key={id}>
                {friend.email}
                <button style={{ marginLeft: 10 }} onClick={() => handleStartChat(friend)}>Chat</button>
                <button style={{ marginLeft: 10 }} onClick={() => handleUntagFriend(id)}>Untag</button>
              </li>
            );
          })}
        </ul>
      )}
      <hr />
      <h3>Start a Chat</h3>
      {users.length === 0 ? <div>No other users found.</div> : (
        <ul>
          {users.map(u => (
            <li key={u.id} style={{ margin: '8px 0' }}>
              {u.email}
              <button style={{ marginLeft: 10 }} onClick={() => handleStartChat(u)}>Chat</button>
              <button style={{ marginLeft: 10 }} onClick={() => handleTagFriend(u.id)} disabled={tagged.includes(u.id)}>
                {tagged.includes(u.id) ? 'Tagged' : 'Tag'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <hr />
      <h3>Your Groups</h3>
      <button onClick={handleCreateGroup} style={{ marginBottom: 10 }}>+ Create Group</button>
      {loading ? <div>Loading groups...</div> : groups.length === 0 ? <div>No groups found.</div> : (
        <ul>
          {groups.map(g => (
            <li key={g.id} style={{ margin: '8px 0' }}>
              {g.name}
              <button style={{ marginLeft: 10 }} onClick={() => handleGoToGroup(g)}>Open</button>
            </li>
          ))}
        </ul>
      )}
      <hr />
      <h3>Public Groups</h3>
      {publicGroups.length === 0 ? <div>No public groups found.</div> : (
        <ul>
          {publicGroups.map(g => (
            <li key={g.id} style={{ margin: '8px 0' }}>
              {g.name}
              {g.members && g.members.includes(user.uid) ? (
                <button style={{ marginLeft: 10 }} onClick={() => handleGoToGroup(g)}>Open</button>
              ) : (
                <button style={{ marginLeft: 10 }} onClick={() => handleJoinPublicGroup(g)}>Join</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard; 