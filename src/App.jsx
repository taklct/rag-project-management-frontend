import { useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="app__header">
        <img src={reactLogo} className="logo" alt="React logo" />
        <h1>RAG Project Management</h1>
        <p className="app__subtitle">
          Kick-start your Retrieval Augmented Generation project management UI with React and Vite.
        </p>
      </header>

      <main className="app__main">
        <p>The counter below confirms that state management is working:</p>
        <div className="app__counter">
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            count is {count}
          </button>
        </div>
        <p>Edit <code>src/App.jsx</code> and save to test hot module replacement.</p>
      </main>
    </div>
  );
}

export default App;
