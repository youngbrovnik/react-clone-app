import React, { useEffect, useRef, useState } from "react";
import { fetchData, drawChart } from "./chartUtils";

const CandleChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState("minutes/1"); // 기본값을 minutes/1로 설정
  const [showBollingerBands, setShowBollingerBands] = useState(false); // 볼린저 밴드 표시 여부
  const [tooltipData, setTooltipData] = useState(null); // OHLC 값을 저장할 상태
  const [selectedIndicators, setSelectedIndicators] = useState([]); // 선택된 지표를 저장할 상태

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
    drawChart({ svgRef, data, interval, showBollingerBands, setTooltipData });
  }, [data, showBollingerBands, interval]);

  const handleIndicatorChange = (indicator) => {
    if (selectedIndicators.includes(indicator)) {
      setSelectedIndicators(selectedIndicators.filter((i) => i !== indicator));
      if (indicator === "bollingerBands") {
        setShowBollingerBands(false);
      }
    } else {
      setSelectedIndicators([...selectedIndicators, indicator]);
      if (indicator === "bollingerBands") {
        setShowBollingerBands(true);
      }
    }
  };

  return (
    <div>
      <select onChange={(e) => setInterval(intervals[e.target.value])} defaultValue="1분">
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
        <button>
          지표
          <div>
            <div onClick={() => handleIndicatorChange("bollingerBands")}>
              <input type="checkbox" checked={selectedIndicators.includes("bollingerBands")} readOnly />
              볼린저 밴드
            </div>
          </div>
        </button>
        <div>
          <p>현재 적용된 지표:</p>
          {selectedIndicators.map((indicator) => (
            <div key={indicator}>
              {indicator === "bollingerBands" && (
                <div>
                  <span>볼린저 밴드</span>
                  <button onClick={() => handleIndicatorChange("bollingerBands")}>X</button>
                </div>
              )}
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
