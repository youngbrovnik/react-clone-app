import React, { useRef, useState, useEffect } from "react";
import useChartData from "../hooks/useChartData";
import { drawChart } from "../utils/chartUtils";
import IntervalSelector from "../components/IntervalSelector";
import IndicatorSettings from "../components/IndicatorSettings";
import { intervals } from "../constants";
import "../styles/CandleChart.css";

const CandleChart = () => {
  const svgRef = useRef();
  const { data, interval, setInterval, loadMoreData } = useChartData("minutes/1");
  const [bollingerBandsSettings, setBollingerBandsSettings] = useState(() => {
    const savedSettings = localStorage.getItem("bollingerBandsSettings");
    return savedSettings ? JSON.parse(savedSettings) : [];
  });
  const [movingAverageSettings, setMovingAverageSettings] = useState(() => {
    const savedSettings = localStorage.getItem("movingAverageSettings");
    return savedSettings ? JSON.parse(savedSettings) : [];
  });
  const [tooltipData, setTooltipData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

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
  };

  const handleMovingAverageSettingChange = (index, field, value) => {
    const newSettings = [...movingAverageSettings];
    newSettings[index][field] = value;
    setMovingAverageSettings(newSettings);
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
  };

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setDragStart(event.clientX);
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;

    const dragEnd = event.clientX;
    const dragDistance = dragEnd - dragStart;

    if (dragDistance > 100) {
      // 임계값을 조정하여 페이지 전환
      loadMoreData("past");
      setIsDragging(false);
    } else if (dragDistance < -100) {
      loadMoreData("future");
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectedIntervalLabel = localStorage.getItem("selectedIntervalLabel") || "1분";

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <IntervalSelector
        intervals={intervals}
        selectedIntervalLabel={selectedIntervalLabel}
        handleIntervalChange={handleIntervalChange}
      />
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
        <IndicatorSettings
          bollingerBandsSettings={bollingerBandsSettings}
          movingAverageSettings={movingAverageSettings}
          handleBollingerBandSettingChange={handleBollingerBandSettingChange}
          handleMovingAverageSettingChange={handleMovingAverageSettingChange}
          removeIndicator={removeIndicator}
        />
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
