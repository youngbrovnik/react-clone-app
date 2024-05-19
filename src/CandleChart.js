// src/CandleChart.js

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

const CandleChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState("minutes/1"); // 기본값을 minutes/1로 설정

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
    const fetchData = (selectedInterval) => {
      const [type, value] = selectedInterval.split("/");
      const url =
        type === "minutes"
          ? `https://api.upbit.com/v1/candles/${type}/${value}?market=KRW-BTC&count=104`
          : `https://api.upbit.com/v1/candles/${type}?market=KRW-BTC&count=104`;

      axios
        .get(url)
        .then((response) => {
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
        })
        .catch((error) => console.error("Error fetching data: ", error));
    };

    fetchData(interval); // 초기 로드시 및 interval 값이 변경될 때마다 데이터를 가져옴
  }, [interval]);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 이전 내용을 지움

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 30, left: 30 }; // 오른쪽 여백을 80으로 설정

    // x축과 y축 설정
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.date))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.low), d3.max(data, (d) => d.high)])
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
            .tickValues(x.domain().filter((d, i) => i % 10 === 0))
        ) // 10개마다 하나씩 노출
        .call((g) => g.select(".domain").remove());

    const yAxis = (g) =>
      g
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick text").style("font-size", "12px").style("font-weight", "bold"));

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // 캔들스틱 차트 그리기
    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.date))
      .attr("y", (d) => y(Math.max(d.open, d.close)))
      .attr("height", (d) => Math.abs(y(d.open) - y(d.close)))
      .attr("width", x.bandwidth())
      .attr("fill", (d) => (d.close > d.open ? "red" : "blue")); // close 값이 open 값보다 크면 빨간색, 작으면 파란색

    svg
      .append("g")
      .selectAll("line")
      .data(data)
      .join("line")
      .attr("x1", (d) => x(d.date) + x.bandwidth() / 2)
      .attr("x2", (d) => x(d.date) + x.bandwidth() / 2)
      .attr("y1", (d) => y(d.high))
      .attr("y2", (d) => y(d.low))
      .attr("stroke", "black");
  }, [data, interval]);

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
      <svg ref={svgRef} width={800} height={400}></svg>
    </div>
  );
};

export default CandleChart;
