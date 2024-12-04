import React, { useState, useEffect } from 'react';
import './App.css';
import { db, auth } from './config/firebase';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

function App() {
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [error, setError] = useState(null);
  const [itemList, setItemList] = useState([]);
  const [selectedUserItems, setSelectedUserItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemIsPriority, setNewItemIsPriority] = useState(false);
  const [usersList, setUsersList] = useState([]);

  const itemCollectionRef = collection(db, 'item');
  const userCollectionRef = collection(db, 'users');

  // Register new user
  const registerUser = async () => {
    try {
      const q = query(userCollectionRef, where('email', '==', registerEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError('This email is already in use.');
        return;
      }
      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      await addDoc(userCollectionRef, { email: registerEmail });
      setError(null);
      setRegisterEmail('');
      setRegisterPassword('');
      alert('Registration successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Sign in user
  const signInUser = async () => {
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      setUserEmail(signInEmail);
      setError(null);
    } catch (err) {
      setError('Invalid email or password.');
    }
  };

  // Get items for the logged-in user
  const getItemList = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(itemCollectionRef, where('userEmail', '==', auth.currentUser.email)); // Use email here
      const data = await getDocs(q);
      const filteredData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setItemList(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  // Get items for a selected user
  const getSelectedUserItems = async (userEmail) => {
    try {
      const q = query(itemCollectionRef, where('userEmail', '==', userEmail)); // Use email here
      const data = await getDocs(q);
      const filteredData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setSelectedUserItems(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  // Get all users from Firestore
  const getUsersList = async () => {
    try {
      const data = await getDocs(userCollectionRef);
      const users = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUsersList(users);
    } catch (err) {
      console.error('Error fetching users: ', err);
    }
  };

  // Add new item to Firestore
  const onSubmitItem = async () => {
    try {
      await addDoc(itemCollectionRef, {
        name: newItemName,
        price: newItemPrice,
        priority: newItemIsPriority,
        userEmail: auth?.currentUser?.email, // Use email instead of userId
      });
      getItemList();
    } catch (error) {
      console.error(error);
    }
  };

  // Delete item
  const deleteItem = async (id) => {
    const itemDoc = doc(db, 'item', id);
    await deleteDoc(itemDoc);
    getItemList();
  };

  // Update item price
  const updateItemPrice = async (id) => {
    const itemDoc = doc(db, 'item', id);
    await updateDoc(itemDoc, { price: newItemPrice });
    getItemList();
  };

  // Handle user logout
  const logoutUser = async () => {
    await signOut(auth);
    setUserEmail(null);
    setItemList([]);
    setSelectedUserItems([]);
  };

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email); // Set user email
        getItemList();
        getUsersList();
      } else {
        setUserEmail(null);
        setSelectedUserItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      <div className="auth-section">
        {userEmail ? (
          <>
            <p>Logged in as: {userEmail}</p>
            <button onClick={logoutUser}>Log Out</button>
          </>
        ) : (
          <>
            <h2>Register</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />
            <button onClick={registerUser}>Register</button>

            <h2>Sign In</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
            />
            <button onClick={signInUser}>Sign In</button>
          </>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      <div className="main-content">
        <div className="sidebar">
          {userEmail && (
            <>
              <h3>All Users</h3>
              <ul>
                <li onClick={() => { setSelectedUserItems([]); getItemList(); }}>
                  No User Selected
                </li>
                {usersList.map((user) => (
                  <li key={user.id} onClick={() => getSelectedUserItems(user.email)}>
                    {user.email}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="item-content">
          {selectedUserItems.length > 0 ? (
            <>
              <h2>Selected User's Items</h2>
              {selectedUserItems.map((item) => (
                <div className={`item-card ${item.priority ? 'priority-item' : ''}`} key={item.id}>
                  <h3>Item: {item.name}</h3>
                  <p>Price: {item.price}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              <h2>Your Items</h2>
              {itemList.map((item) => (
                <div className={`item-card ${item.priority ? 'priority-item' : ''}`} key={item.id}>
                  <h3>Item: {item.name}</h3>
                  <p>Price: {item.price}</p>
                  <button onClick={() => deleteItem(item.id)}>Delete</button>
                  <input
                    placeholder="New Price"
                    type="number"
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  />
                  <button onClick={() => updateItemPrice(item.id)}>Update</button>
                </div>
              ))}
            </>
          )}

          {userEmail && (
            <>
              <div>
                <input
                  placeholder="Item Name..."
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <input
                  placeholder="Price of Item..."
                  type="number"
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                />
                <input
                  type="checkbox"
                  checked={newItemIsPriority}
                  onChange={(e) => setNewItemIsPriority(e.target.checked)}
                />
                <label>Is high Priority?</label>
                <button onClick={onSubmitItem}>Add Item</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
