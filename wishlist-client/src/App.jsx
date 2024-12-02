
import React, { useEffect, useState } from 'react';
import './App.css';
import { Auth } from './components/auth.jsx';
import { db }from './config/firebase';
import { getDoc, collection, getDocs } from 'firebase/firestore';

function App() {

  const [itemList, setItemList] = useState([]);

  const itemCollectionRef = collection(db, "item"); // the reference to database
  

  useEffect( () => {
    const getItemList = async () => {
      //read data and set item list
      try {
      const data = await getDocs(itemCollectionRef);
      console.log(data);
      } catch (err) {
        console.error(err);
      }
    }
    getItemList();
  }, []);


  return (

   <div className="App"><Auth /></div>

  );
}

export default App