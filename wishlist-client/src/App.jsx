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
  const [userEmail, setUserEmail] = useState(null); // Store logged-in user's email
  const [error, setError] = useState(null); // Store error messages
  const [itemList, setItemList] = useState([]); // State for items list
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemIsPriority, setNewItemIsPriority] = useState(false); // New item priority
  const [usersList, setUsersList] = useState([]); // Store the list of users

  const itemCollectionRef = collection(db, 'item'); // Reference to the "item" collection
  const userCollectionRef = collection(db, 'users'); // Reference to the "users" collection

  // Register new user
  const registerUser = async () => {
    try {
      // Check if email already exists in Firestore
      const q = query(userCollectionRef, where('email', '==', registerEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('This email is already in use.');
        return; // Exit the function if email is already registered
      }

      // Register the user with Firebase Authentication
      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);

      // Add email to Firestore users collection
      await addDoc(userCollectionRef, { email: registerEmail });

      setError(null); // Reset any previous errors
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
      // Sign in the user with Firebase Authentication
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      setUserEmail(signInEmail); // Set the logged-in user's email
      setError(null); // Reset any previous errors
    } catch (err) {
      setError('Invalid email or password.');
    }
  };

  // Get items for the logged-in user
  const getItemList = async () => {
    if (!auth.currentUser) {
      return; // If no user is logged in, don't fetch items
    }

    try {
      const q = query(itemCollectionRef, where('userId', '==', auth.currentUser.uid));
      const data = await getDocs(q);
      const filteredData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setItemList(filteredData);
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
        userId: auth?.currentUser?.uid, // Store userId with each item
      });
      getItemList(); // Refresh the item list after adding a new item
    } catch (error) {
      console.error(error);
    }
  };

  // Delete item
  const deleteItem = async (id) => {
    const itemDoc = doc(db, 'item', id);
    await deleteDoc(itemDoc);
    getItemList(); // Refresh the item list after deleting
  };

  // Update item price
  const updateItemPrice = async (id) => {
    const itemDoc = doc(db, 'item', id);
    await updateDoc(itemDoc, { price: newItemPrice });
    getItemList(); // Refresh the item list after updating
  };

  // Handle user logout
  const logoutUser = async () => {
    await signOut(auth);
    setUserEmail(null); // Reset the logged-in user's email state
    setItemList([]); // Clear the item list on logout
  };

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        getItemList(); // Fetch items when user logs in
        getUsersList(); // Fetch all users when a user logs in
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
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

      {/* Display all users after login */}
      <div>
        {userEmail && (
          <>
            <h2>All Users</h2>
            <ul>
              {usersList.map((user) => (
                <li key={user.id}>{user.email}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Display items if logged in */}
      <div>
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
              <label>Is high Priority</label>
              <button onClick={onSubmitItem}>Submit Item</button>
            </div>

            <div>
              {itemList.map((item) => (
                <div
                  className={`item-card ${item.priority ? 'priority-item' : ''}`}
                  key={item.id}
                >
                  <h3>Item: {item.name}</h3>
                  <p>Price: {item.price}</p>
                  <button onClick={() => deleteItem(item.id)}>Delete</button>
                  <input
                    type="number"
                    placeholder="New price..."
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  />
                  <button onClick={() => updateItemPrice(item.id)}>Update Price</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
