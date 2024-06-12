import * as d3 from "d3";
import axios from "axios";
import { calculateBollingerBands } from "./bollingerBands";

const BOLLINGER_BAND_PERIOD = 20;

export const fetchData = async (interval, setData) => {
  const [type, value] = interval.split("/");
  const count = 104 + BOLLINGER_BAND_PERIOD;
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

export const drawChart = ({ svgRef, data, interval, showBollingerBands, setTooltipData }) => {
  const filteredData = data.slice(BOLLINGER_BAND_PERIOD - 1);

  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove();

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 80, bottom: 30, left: 30 };

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

  svg
    .append("g")
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", (d) => x(d.date) - candleWidth / 2)
    .attr("y", (d) => y(Math.max(d.open, d.close)))
    .attr("height", (d) => Math.abs(y(d.open) - y(d.close)))
    .attr("width", candleWidth)
    .attr("fill", (d) => (d.close > d.open ? "red" : "blue"));

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

  if (showBollingerBands) {
    const bollingerBands = calculateBollingerBands(data);

    const area = d3
      .area()
      .x((d) => x(d.date))
      .y0((d) => y(d.upperBand))
      .y1((d) => y(d.lowerBand));

    svg.append("path").datum(bollingerBands).attr("fill", "black").attr("opacity", 0.1).attr("d", area);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.middleBand));

    svg
      .append("path")
      .datum(bollingerBands)
      .attr("fill", "none")
      .attr("stroke", "black")
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
      .attr("stroke", "black")
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
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", lowerLine);
  }

  const focus = svg.append("g").attr("class", "focus").style("display", "none");

  focus.append("line").attr("class", "x-hover-line hover-line").attr("y1", 0).attr("y2", height);

  focus.append("line").attr("class", "y-hover-line hover-line").attr("x1", width).attr("x2", width);

  focus.append("circle").attr("r", 7.5);

  svg
    .append("rect")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", () => focus.style("display", null))
    .on("mouseout", () => focus.style("display", "none"))
    .on("mousemove", (event) => mousemove(event, filteredData, x, y, focus, setTooltipData, width, height));
};

const mousemove = (event, filteredData, x, y, focus, setTooltipData, width, height) => {
  const bisectDate = d3.bisector((d) => d.date).left;
  const x0 = x.invert(d3.pointer(event)[0]);
  const i = bisectDate(filteredData, x0, 1);
  const d0 = filteredData[i - 1];
  const d1 = filteredData[i];
  const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
  focus.attr("transform", `translate(${x(d.date)},${y(d.close)})`);
  focus.select(".x-hover-line").attr("y2", height - y(d.close));
  focus.select(".y-hover-line").attr("x2", width + width);
  setTooltipData(d);
};
