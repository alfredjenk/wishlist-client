import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useState } from "react";


export const Auth = () => {
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const signIn = async () => {

        try {
        await createUserWithEmailAndPassword(auth, email, password)
        }catch (err) {
            console.error(err);
        }  
    };
   
    const logout = async () => {

        try {
        await signOut(auth)
        }catch (err) {
            console.error(err);
        }  
    };
   
    return (

        <div>
            
        <input placeholder="Email..."
        onChange={(e) => setEmail(e.target.value)}
        />
        <input placeholder="Password..."
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        />
        <button onClick={signIn}> Sign in </button>

        <button onClick={logout}>Logout</button> 
        </div>


    );


};