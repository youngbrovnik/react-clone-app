// src/CandleChart.js

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import axios from "axios";

const CandleChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState("minutes/1"); // 기본값을 minutes/1로 설정
  const [showBollingerBands, setShowBollingerBands] = useState(false); // 볼린저 밴드 표시 여부
  const [tooltipData, setTooltipData] = useState(null); // OHLC 값을 저장할 상태

  const BOLLINGER_BAND_PERIOD = 20; // 볼린저 밴드 기간 (평균 갯수)
  const BOLLINGER_BAND_STD_DEV = 2; // 볼린저 밴드 표준 편차

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

  const fetchData = async (selectedInterval) => {
    const [type, value] = selectedInterval.split("/");
    const count = 104 + BOLLINGER_BAND_PERIOD; // count 값을 104 + BOLLINGER_BAND_PERIOD로 설정
    const url =
      type === "minutes"
        ? `https://api.upbit.com/v1/candles/${type}/${value}?market=KRW-BTC&count=${count}`
        : `https://api.upbit.com/v1/candles/${type}?market=KRW-BTC&count=${count}`;

    try {
      const response = await axios.get(url);
      const transformedData = response.data
        .map((d) => ({
          date: new Date(d.timestamp),
          open: d.opening_price,
          high: d.high_price,
          low: d.low_price,
          close: d.trade_price,
        }))
        .reverse(); // 최신 데이터를 오른쪽에 표시하기 위해 데이터 순서를 뒤집음
      setData(transformedData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const calculateBollingerBands = (data) => {
    const windowSize = BOLLINGER_BAND_PERIOD;
    const numStdDev = BOLLINGER_BAND_STD_DEV;

    const bollingerBands = data.map((d, i) => {
      if (i < windowSize - 1) return null;

      const slice = data.slice(i - windowSize + 1, i + 1);
      const mean = d3.mean(slice, (d) => d.close);
      const stdDev = d3.deviation(slice, (d) => d.close);

      return {
        date: d.date,
        middleBand: mean,
        upperBand: mean + numStdDev * stdDev,
        lowerBand: mean - numStdDev * stdDev,
      };
    });

    return bollingerBands.filter((d) => d !== null);
  };

  const drawChart = useCallback(() => {
    const filteredData = data.slice(BOLLINGER_BAND_PERIOD - 1); // 그래프를 21번째 값부터 그리도록 설정

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 이전 내용을 지움

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 30, left: 30 }; // 오른쪽 여백을 80으로 설정

    // x축과 y축 설정
    const x = d3
      .scaleTime()
      .domain([filteredData[0].date, filteredData[filteredData.length - 1].date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(filteredData, (d) => d.low), d3.max(filteredData, (d) => d.high)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const isMinutesInterval = interval.startsWith("minutes");

    const xAxis = (g) =>
      g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom(x)
            .tickFormat(d3.timeFormat(isMinutesInterval ? "%H:%M" : "%Y-%m-%d"))
            .tickValues(filteredData.map((d, i) => (i % 10 === 0 ? d.date : null)).filter((d) => d))
        )
        .call((g) => g.select(".domain").remove());

    const yAxis = (g) =>
      g
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick text").style("font-size", "12px").style("font-weight", "bold"));

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    const candleWidth = (width - margin.left - margin.right) / filteredData.length;

    // 캔들스틱 차트 그리기
    svg
      .append("g")
      .selectAll("rect")
      .data(filteredData)
      .join("rect")
      .attr("x", (d) => x(d.date) - candleWidth / 2)
      .attr("y", (d) => y(Math.max(d.open, d.close)))
      .attr("height", (d) => Math.abs(y(d.open) - y(d.close)))
      .attr("width", candleWidth)
      .attr("fill", (d) => (d.close > d.open ? "red" : "blue")); // close 값이 open 값보다 크면 빨간색, 작으면 파란색

    svg
      .append("g")
      .selectAll("line")
      .data(filteredData)
      .join("line")
      .attr("x1", (d) => x(d.date))
      .attr("x2", (d) => x(d.date))
      .attr("y1", (d) => y(d.high))
      .attr("y2", (d) => y(d.low))
      .attr("stroke", "black");

    // 볼린저 밴드 그리기
    if (showBollingerBands) {
      const bollingerBands = calculateBollingerBands(data);

      // 영역을 채우기 위해 area 생성
      const area = d3
        .area()
        .x((d) => x(d.date))
        .y0((d) => y(d.upperBand))
        .y1((d) => y(d.lowerBand));

      svg
        .append("path")
        .datum(bollingerBands)
        .attr("fill", "black") // 색을 검은색으로 변경
        .attr("opacity", 0.1)
        .attr("d", area);

      const line = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.middleBand));

      svg
        .append("path")
        .datum(bollingerBands)
        .attr("fill", "none")
        .attr("stroke", "black") // 색을 검은색으로 변경
        .attr("stroke-width", 1.5)
        .attr("d", line);

      const upperLine = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.upperBand));

      svg
        .append("path")
        .datum(bollingerBands)
        .attr("fill", "none")
        .attr("stroke", "black") // 색을 검은색으로 변경
        .attr("stroke-width", 1.5)
        .attr("d", upperLine);

      const lowerLine = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.lowerBand));

      svg
        .append("path")
        .datum(bollingerBands)
        .attr("fill", "none")
        .attr("stroke", "black") // 색을 검은색으로 변경
        .attr("stroke-width", 1.5)
        .attr("d", lowerLine);
    }

    // 포인터와 점선 추가
    const focus = svg.append("g").attr("class", "focus").style("display", "none");

    focus.append("line").attr("class", "x-hover-line hover-line").attr("y1", 0).attr("y2", height);

    focus.append("line").attr("class", "y-hover-line hover-line").attr("x1", width).attr("x2", width);

    focus.append("circle").attr("r", 7.5);

    // 마우스 이동 이벤트 처리
    svg
      .append("rect")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => focus.style("display", null))
      .on("mouseout", () => focus.style("display", "none"))
      .on("mousemove", mousemove);

    function mousemove(event) {
      const bisectDate = d3.bisector((d) => d.date).left;
      const x0 = x.invert(d3.pointer(event, this)[0]);
      const i = bisectDate(filteredData, x0, 1);
      const d0 = filteredData[i - 1];
      const d1 = filteredData[i];
      const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      focus.attr("transform", `translate(${x(d.date)},${y(d.close)})`);
      focus.select(".x-hover-line").attr("y2", height - y(d.close));
      focus.select(".y-hover-line").attr("x2", width + width);
      setTooltipData(d);
    }
  }, [data, interval, showBollingerBands]);

  useEffect(() => {
    fetchData(interval);
  }, [interval]);

  useEffect(() => {
    if (data.length === 0) return;

    drawChart();
  }, [data, showBollingerBands, drawChart]);

  return (
    <div>
      <button onClick={() => setShowBollingerBands(!showBollingerBands)}>
        {showBollingerBands ? "볼린저 밴드 해제" : "볼린저 밴드 적용"}
      </button>
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
