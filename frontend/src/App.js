import { useEffect, useState } from "react";
import "./App.css";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import UserInfo from "./components/UserInfo";

function App() {
  const [user, setUser] = useState("");
  return (
    <div className="App">
      <header className="App-header">
        <h1>React API Demo</h1>
      </header>

      <main className="main-section">
        {user ? (
          <UserInfo user={user} setUser={setUser}/>
        ) : signUpPage ? (
          <SignUp setSignUpPage={setSignUpPage} user={user} setUser={setUser} />
        ) : (
          <Login setSignUpPage={setSignUpPage} user={user} setUser={setUser} />
        )}
        {user && (<Page/>)}
        {user && (<NotesDisplay notes={notes} setNotes={setNotes}/>)}

        
      </main>
    </div>
  );
}

export default App;
