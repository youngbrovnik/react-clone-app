// src/App.js

import React from "react";
import "./App.css";
import CandleChart from "./CandleChart";

function App() {
  return (
    <div className="App">
      <h1>Bitcoin Candlestick Chart</h1>
      <CandleChart />
    </div>
  );
}

export default App;
