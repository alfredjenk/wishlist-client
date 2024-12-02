
import React, { useEffect, useState } from 'react';
import './App.css';
import { Auth } from './components/auth.jsx';
import { db }from './config/firebase';
import { getDoc, collection, getDocs, doc, addDoc } from 'firebase/firestore';
import { applyActionCode } from 'firebase/auth';

function App() {

  const [itemList, setItemList] = useState([]); //state for items list

  const itemCollectionRef = collection(db, "item"); // the reference to database
  
  //new item states

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemIsPriority, setNewItemIsPriority] = useState(false); 
  
  const getItemList = async () => {
    //read data and set item list
    try {
    const data = await getDocs(itemCollectionRef);
    const filteredData = data.docs.map((doc) => ({...doc.data(), id: doc.id}));
    setItemList(filteredData);
    //console.log({filteredData});
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async () => {
    

  };

  useEffect( () => {
    getItemList();
  }, []);


  const onSubmitItem = async () => {
    try {
      await addDoc(itemCollectionRef, {name: newItemName, price: newItemPrice, priority: newItemIsPriority,});
      getItemList();
    } catch (error) {
      console.error(err);
    }

  };

  return (

   <div className="App">
      <Auth />

      <div>
        <input placeholder='Item Name...' onChange={(e) => setNewItemName(e.target.value)}/>
        <input placeholder='Price of Item...' type='number' onChange={(e) => setNewItemPrice(Number(e.target.value))}/>
        <input type = 'checkbox'  checked={newItemIsPriority} onChange={(e) => setNewItemIsPriority(e.target.checked)}/>
        <label> Is high Priority </label>
        <button onClick={onSubmitItem}> Submit Item </button>

      </div>


      <div>
        {itemList.map((item) => (
          <div>
            <h1> Item: {item.name} </h1>
            <p> Price: {item.price} </p>

          </div>

        ))}


      </div> 
   
   </div> 
    

  );
}

export default App