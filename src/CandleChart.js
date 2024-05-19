// src/CandleChart.js

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

const CandleChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("https://api.upbit.com/v1/candles/minutes/1?market=KRW-BTC&count=100")
      .then((response) => {
        const transformedData = response.data.map((d) => ({
          date: new Date(d.timestamp),
          open: d.opening_price,
          high: d.high_price,
          low: d.low_price,
          close: d.trade_price,
        }));
        setData(transformedData);
      })
      .catch((error) => console.error("Error fetching data: ", error));
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

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

    const xAxis = (g) =>
      g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom(x)
            .tickFormat(d3.timeFormat("%H:%M"))
            .tickValues(x.domain().filter((d, i) => !(i % 10)))
        )
        .call((g) => g.select(".domain").remove());

    const yAxis = (g) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call((g) => g.select(".domain").remove());

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.date))
      .attr("y", (d) => y(Math.max(d.open, d.close)))
      .attr("height", (d) => Math.abs(y(d.open) - y(d.close)))
      .attr("width", x.bandwidth())
      .attr("fill", (d) => (d.open > d.close ? "red" : "blue"));

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
  }, [data]);

  return <svg ref={svgRef} width={800} height={400}></svg>;
};

export default CandleChart;