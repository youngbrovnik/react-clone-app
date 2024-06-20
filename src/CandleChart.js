import React, { useEffect, useRef, useState } from "react";
import { fetchData, drawChart } from "./chartUtils";
import "./CandleChart.css"; // 스타일링을 위해 CSS 파일을 임포트합니다.

const CandleChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState(() => localStorage.getItem("interval") || "minutes/1"); // 기본값을 로컬 스토리지에서 가져옴
  const [bollingerBandsSettings, setBollingerBandsSettings] = useState(() => {
    const savedSettings = localStorage.getItem("bollingerBandsSettings");
    return savedSettings ? JSON.parse(savedSettings) : [];
  });
  const [movingAverageSettings, setMovingAverageSettings] = useState(() => {
    const savedSettings = localStorage.getItem("movingAverageSettings");
    return savedSettings ? JSON.parse(savedSettings) : [];
  });
  const [tooltipData, setTooltipData] = useState(null); // OHLC 값을 저장할 상태

  const intervals = {
    "1일": "days",
    "1주": "weeks",
    "한 달": "months",
    "1분": "minutes/1",
    "3분": "minutes/3",
    "5분": "minutes/5",
    "10분": "minutes/10",
    "15분": "minutes/15",
    "30분": "minutes/30",
    "1시간": "minutes/60",
    "4시간": "minutes/240",
  };

  useEffect(() => {
    fetchData(interval, setData);
  }, [interval]);

  useEffect(() => {
    if (data.length === 0) return;
    drawChart({
      svgRef,
      data,
      interval,
      bollingerBandsSettings,
      movingAverageSettings,
      setTooltipData,
    });
  }, [data, bollingerBandsSettings, movingAverageSettings, interval]);

  useEffect(() => {
    localStorage.setItem("interval", interval);
  }, [interval]);

  useEffect(() => {
    localStorage.setItem("bollingerBandsSettings", JSON.stringify(bollingerBandsSettings));
  }, [bollingerBandsSettings]);

  useEffect(() => {
    localStorage.setItem("movingAverageSettings", JSON.stringify(movingAverageSettings));
  }, [movingAverageSettings]);

  const handleIntervalChange = (e) => {
    const newInterval = intervals[e.target.value];
    setInterval(newInterval);
    localStorage.setItem("selectedIntervalLabel", e.target.value);
  };

  const handleIndicatorChange = (indicator) => {
    if (indicator === "bollingerBands") {
      setBollingerBandsSettings([...bollingerBandsSettings, { period: 20, stddev: 2, color: "black" }]);
    } else if (indicator === "movingAverage") {
      setMovingAverageSettings([...movingAverageSettings, { period: 20, color: "black" }]);
    }
  };

  const handleBollingerBandSettingChange = (index, field, value) => {
    const newSettings = [...bollingerBandsSettings];
    newSettings[index][field] = value;
    setBollingerBandsSettings(newSettings);
    drawChart({
      svgRef,
      data,
      interval,
      bollingerBandsSettings: newSettings,
      movingAverageSettings,
      setTooltipData,
    });
  };

  const handleMovingAverageSettingChange = (index, field, value) => {
    const newSettings = [...movingAverageSettings];
    newSettings[index][field] = value;
    setMovingAverageSettings(newSettings);
    drawChart({
      svgRef,
      data,
      interval,
      bollingerBandsSettings,
      movingAverageSettings: newSettings,
      setTooltipData,
    });
  };

  const removeIndicator = (indicator, index) => {
    if (indicator === "bollingerBands") {
      const newSettings = [...bollingerBandsSettings];
      newSettings.splice(index, 1);
      setBollingerBandsSettings(newSettings);
    } else if (indicator === "movingAverage") {
      const newSettings = [...movingAverageSettings];
      newSettings.splice(index, 1);
      setMovingAverageSettings(newSettings);
    }
    drawChart({
      svgRef,
      data,
      interval,
      bollingerBandsSettings,
      movingAverageSettings,
      setTooltipData,
    });
  };

  const selectedIntervalLabel = localStorage.getItem("selectedIntervalLabel") || "1분";

  return (
    <div>
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
      <div>
        <button className="indicator-button">
          지표
          <div className="indicator-list">
            <div
              className="indicator-item"
              onMouseEnter={(e) => e.currentTarget.classList.add("hover")}
              onMouseLeave={(e) => e.currentTarget.classList.remove("hover")}
              onClick={() => handleIndicatorChange("bollingerBands")}
            >
              볼린저 밴드
            </div>
            <div
              className="indicator-item"
              onMouseEnter={(e) => e.currentTarget.classList.add("hover")}
              onMouseLeave={(e) => e.currentTarget.classList.remove("hover")}
              onClick={() => handleIndicatorChange("movingAverage")}
            >
              이동 평균
            </div>
          </div>
        </button>
        <div>
          <p>현재 적용된 지표:</p>
          {bollingerBandsSettings.map((setting, index) => (
            <div key={`bollinger-${index}`}>
              <span>볼린저 밴드</span>
              <label>
                기간:
                <input
                  type="number"
                  value={setting.period}
                  onChange={(e) => handleBollingerBandSettingChange(index, "period", Number(e.target.value))}
                />
              </label>
              <label>
                표준 편차:
                <input
                  type="number"
                  value={setting.stddev}
                  step="0.1"
                  onChange={(e) => handleBollingerBandSettingChange(index, "stddev", Number(e.target.value))}
                />
              </label>
              <label>
                색상:
                <input
                  type="color"
                  value={setting.color}
                  onChange={(e) => handleBollingerBandSettingChange(index, "color", e.target.value)}
                />
              </label>
              <button onClick={() => removeIndicator("bollingerBands", index)}>X</button>
            </div>
          ))}
          {movingAverageSettings.map((setting, index) => (
            <div key={`movingAverage-${index}`}>
              <span>이동 평균</span>
              <label>
                기간:
                <input
                  type="number"
                  value={setting.period}
                  onChange={(e) => handleMovingAverageSettingChange(index, "period", Number(e.target.value))}
                />
              </label>
              <label>
                색상:
                <input
                  type="color"
                  value={setting.color}
                  onChange={(e) => handleMovingAverageSettingChange(index, "color", e.target.value)}
                />
              </label>
              <button onClick={() => removeIndicator("movingAverage", index)}>X</button>
            </div>
          ))}
        </div>
      </div>
      <svg ref={svgRef} width={800} height={400}></svg>
      {tooltipData && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            padding: "10px",
            backgroundColor: "white",
            border: "1px solid black",
          }}
        >
          <p>Open: {tooltipData.open}</p>
          <p>High: {tooltipData.high}</p>
          <p>Low: {tooltipData.low}</p>
          <p>Close: {tooltipData.close}</p>
        </div>
      )}
    </div>
  );
};

export default CandleChart;
