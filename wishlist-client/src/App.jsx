import React, { useState, useEffect } from 'react';
import './App.css';
import { db, auth, storage } from './config/firebase';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


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
  const [selectedUserEmail, setSelectedUserEmail] = useState(null); // To track the selected user's email
  const [announcement, setAnnouncement] = useState(''); // Announcement state
  const [userPrivacy, setUserPrivacy] = useState(false); // To track user privacy
  const [totalPrice, setTotalPrice] = useState(0);
  const [newListPassword, setNewListPassword] = useState(''); // Initialize state for new list password
  const [fileUpload, setFileUpload] = useState(null);
  const [newItemLink, setNewItemLink] = useState(''); // To store the link



  const itemCollectionRef = collection(db, 'item');
  const userCollectionRef = collection(db, 'users');

  // Register new user
  // Register new user with a password for their list
  const registerUser = async () => {
    try {
      const q = query(userCollectionRef, where('email', '==', registerEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError('This email is already in use.');
        return;
      }
      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      await addDoc(userCollectionRef, {
        email: registerEmail,
        privacy: false, // Set privacy to false by default
        listPassword: '', // Add a field for list password
      });
      setError(null);
      setRegisterEmail('');
      setRegisterPassword('');
      alert('Registration successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Function to set a password for viewing item list
  const setListPassword = async () => {
    if (!userEmail || !newListPassword) return;
    try {
      const q = query(userCollectionRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(db, 'users', userDoc.id);

        await updateDoc(userRef, {
          listPassword: newListPassword, // Update list password
        });

        setAnnouncement('Password for your item list has been updated.');
        setNewListPassword('');
      }
    } catch (err) {
      console.error(err);
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
      calculateTotalPrice(filteredData); // Calculate total price after getting the items
    } catch (err) {
      console.error(err);
    }
  };


  // Get items for a selected user
  // Check password before showing a selected user's items
  const getSelectedUserItems = async (userEmail) => {
    try {
      const q = query(userCollectionRef, where('email', '==', userEmail));
      const userSnapshot = await getDocs(q);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];

        // If privacy is enabled, prompt for the password
        if (userDoc.data().privacy) {
          const enteredPassword = prompt('Enter the password to view the list:');

          if (enteredPassword !== userDoc.data().listPassword) {
            setAnnouncement('Incorrect password. You cannot view this list.');
            setSelectedUserItems([]); // Clear selected items
            return;
          }
        }

        // If privacy is disabled, just fetch and show the list
        const itemQ = query(itemCollectionRef, where('userEmail', '==', userEmail));
        const data = await getDocs(itemQ);
        const filteredData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setSelectedUserItems(filteredData);
        setSelectedUserEmail(userEmail); // Update the selected user's email
      }
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
    if (!userEmail || !newItemName || !newItemPrice) return;
  
    try {
      let fileUrl = '';
  
      // Upload file if a file is selected
      if (fileUpload) {
        const fileRef = ref(storage, `itemPhotos/${fileUpload.name}`);
        await uploadBytes(fileRef, fileUpload);
        fileUrl = await getDownloadURL(fileRef); // Get the download URL of the uploaded file
      }
  
      // Add item with the file URL to Firestore
      await addDoc(itemCollectionRef, {
        name: newItemName,
        price: newItemPrice,
        priority: newItemIsPriority,
        userEmail: auth?.currentUser?.email,
        link: newItemLink,
        imageUrl: fileUrl, // Save the file URL in Firestore
      });
  
      // Clear form inputs
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemIsPriority(false);
      setNewItemLink('');
      setFileUpload(null); // Clear the selected file
  
      // Refresh the item list
      getItemList();
    } catch (error) {
      console.error("Error adding item: ", error);
    }
  };
  



  const uploadFile = async () => {
    if (!fileUpload) return;
    const filesFolderRef = ref(storage, `itemPhotos/${fileUpload.name}`);
    try {
      await uploadBytes(filesFolderRef, fileUpload);
    } catch (error) {
      console.error(err);
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
    calculateTotalPrice();
  };

  // Calculate the total price of items
  const calculateTotalPrice = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      setTotalPrice(0); // If items array is empty or invalid, set total price to 0
      return;
    }

    const total = items.reduce((acc, item) => acc + parseFloat(item.price || 0), 0);
    setTotalPrice(total.toFixed(2)); // Update total price
  };

  // Toggle Privacy Setting
  const togglePrivacy = async () => {
    if (!userEmail) return;

    const q = query(userCollectionRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(db, 'users', userDoc.id);

      // Toggle the privacy field
      await updateDoc(userRef, {
        privacy: !userDoc.data().privacy
      });

      // Update the local state
      setAnnouncement(`Privacy has been ${!userDoc.data().privacy ? 'enabled' : 'disabled'}.`);
      setUserPrivacy(!userDoc.data().privacy);
    }
  };

  // Handle user logout
  const logoutUser = async () => {
    await signOut(auth);
    setUserEmail(null);
    setItemList([]);
    setSelectedUserItems([]);
    setSelectedUserEmail(null);
  };

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email); // Set user email
        getItemList();
        getUsersList();
        calculateTotalPrice();

        // Check privacy for the logged-in user
        const userQ = query(userCollectionRef, where('email', '==', user.email));
        getDocs(userQ).then(querySnapshot => {
          if (!querySnapshot.empty) {
            setUserPrivacy(querySnapshot.docs[0].data().privacy);
          }
        });
      } else {
        setUserEmail(null);
        setSelectedUserItems([]);
        setSelectedUserEmail(null);
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
            <button onClick={togglePrivacy}>
              {userPrivacy ? 'Disable Privacy' : 'Enable Privacy'}
            </button>
            <p>{announcement}</p>
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

        {userEmail && (
          <div>
            <h3>Set/Update Password for Your Item List</h3>
            <input
              type="password"
              placeholder="Enter new password"
              value={newListPassword}
              onChange={(e) => setNewListPassword(e.target.value)}
            />
            <button onClick={setListPassword}>Set Password</button>
          </div>
        )}


      </div>

      <div className="main-content">
        <div className="sidebar">
          {userEmail && (
            <>
              <h3>All Users</h3>
              <ul>
                <li onClick={() => { setSelectedUserItems([]); setSelectedUserEmail(null); setAnnouncement(''); }}>
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

        <div className="items-list">
          {userEmail && !selectedUserEmail && (
            <>
              <h3>Your Items</h3>
              <ul>
                {itemList.map((item) => (
                  <li key={item.id} className={item.priority ? 'priority-item' : ''}>
                    {item.name} - ${item.price}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer">View Link</a>
                    )}
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} width="100" height="100" />
                      )}
                    <button onClick={() => deleteItem(item.id)}>Delete</button>
                  </li>
                ))}
              </ul>


              <h4>Total Price: ${totalPrice}</h4>

              <input
                type="text"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={newItemIsPriority}
                  onChange={(e) => setNewItemIsPriority(e.target.checked)}
                />
                Mark as Priority
              </label>

              <input type="url" 
              placeholder="Enter item link" 
              value={newItemLink} 
              onChange={(e) => setNewItemLink(e.target.value)} 
              />

          
              <input
                type="file"
                onChange={(e) => setFileUpload(e.target.files[0])}
              />


              <button onClick={onSubmitItem}>Add Item</button>
            </>
          )}

          {selectedUserEmail && (
            <>
              <h3>{selectedUserEmail}'s Items</h3>
              <ul>
                {selectedUserItems.map((item) => (
                  <li key={item.id}>{item.name} - ${item.price}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <input type='file' onChange={(e) => setFileUpload(e.target.files[0])} />
        <button onClick={uploadFile}> Upload Picture of Item </button>
        <div>



        </div>


      </div>
    </div>
  );
}

export default App;