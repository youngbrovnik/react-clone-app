// src/App.js

import React from "react";
import "./styles/App.css";
import CandleChart from "./components/CandleChart";

function App() {
  return (
    <div className="App">
      <h1>Bitcoin Candlestick Chart</h1>
      <CandleChart />
    </div>
  );
}

export default App;
