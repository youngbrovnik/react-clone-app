import React from "react";

const IntervalSelector = ({ intervals, selectedIntervalLabel, handleIntervalChange }) => (
  <select onChange={handleIntervalChange} value={selectedIntervalLabel}>
    <optgroup label="날짜 단위">
      <option value="1일">1일</option>
      <option value="1주">1주</option>
      <option value="한 달">한 달</option>
    </optgroup>
    <optgroup label="분 단위">
      {Object.keys(intervals)
        .filter((key) => key.includes("분") || key.includes("시간"))
        .map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
    </optgroup>
  </select>
);

export default IntervalSelector;
