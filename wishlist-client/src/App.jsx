import React, { useEffect, useState } from 'react';
import './App.css';
import { Auth } from './components/auth.jsx';
import { db, auth } from './config/firebase';
import { getDoc, collection, getDocs, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

function App() {
  const [itemList, setItemList] = useState([]); // state for items list
  const [userList, setUserList] = useState([]); // state for the users list
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemIsPriority, setNewItemIsPriority] = useState(false); // new item priority
  const [updatedPrice, setUpdatedPrice] = useState(0); // Update Price state
  const [userEmail, setUserEmail] = useState(null); // Logged-in user's email state

  const itemCollectionRef = collection(db, "item"); // the reference to database
  const userCollectionRef = collection(db, "users"); // reference to the "users" collection

  // Get the item list from Firestore
  const getItemList = async () => {
    try {
      const data = await getDocs(itemCollectionRef);
      const filteredData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setItemList(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  // Get the user list from Firestore
  const getUserList = async () => {
    try {
      const data = await getDocs(userCollectionRef);
      const filteredData = data.docs.map((doc) => doc.data());
      setUserList(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  // Add a new user to Firestore
  const addUserToFirestore = async (email) => {
    try {
      await addDoc(userCollectionRef, { email });
      getUserList(); // Refresh the user list after adding a new user
    } catch (err) {
      console.error(err);
    }
  };

  // Delete item from Firestore
  const deleteItem = async (id) => {
    const itemDoc = doc(db, 'item', id);
    await deleteDoc(itemDoc);
    getItemList(); // Refresh item list after deletion
  };

  // Update item price in Firestore
  const updateItemPrice = async (id) => {
    const itemDoc = doc(db, 'item', id);
    await updateDoc(itemDoc, { price: updatedPrice });
    getItemList(); // Refresh item list after price update
  };

  // Add new item to Firestore
  const onSubmitItem = async () => {
    try {
      await addDoc(itemCollectionRef, {
        name: newItemName,
        price: newItemPrice,
        priority: newItemIsPriority,
        userId: auth?.currentUser?.uid, // Ensure only authenticated users can add items
      });
      getItemList(); // Refresh item list after adding a new item
    } catch (error) {
      console.error(error);
    }
  };

  // Get the logged-in user's email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        addUserToFirestore(user.email); // Add user to Firestore when they log in
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  // Fetch items and users when the component is mounted
  useEffect(() => {
    getItemList();
    getUserList();
  }, []);

  return (
    <div className="App">
      <Auth /> {/* Include authentication component */}

      <div className="user-info">
        {userEmail ? (
          <p>Logged in as: {userEmail}</p>
        ) : (
          <p>Please log in to add and update items.</p>
        )}
      </div>

      <div className="main-content">
        <div className="sidebar">
          <h3>Users</h3>
          <ul>
            {userList.map((user, index) => (
              <li key={index}>{user.email}</li>
            ))}
          </ul>
        </div>

        <div className="item-content">
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

                {userEmail && (
                  <>
                    <button onClick={() => deleteItem(item.id)}>Delete Item</button>
                    <input
                      placeholder="New price..."
                      onChange={(e) => setUpdatedPrice(Number(e.target.value))}
                    />
                    <button onClick={() => updateItemPrice(item.id)}>Update Price</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
