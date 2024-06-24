import * as d3 from "d3";
import axios from "axios";
import { saveData, loadData } from "./idb"; // idb 헬퍼 파일에서 함수들을 가져옵니다.

const BOLLINGER_BAND_PERIOD = 20;
const BOLLINGER_BAND_STD_DEV = 2;

export const fetchData = async (interval, setData, page = 0) => {
  const [type, value] = interval.split("/");
  const count = 104 + BOLLINGER_BAND_PERIOD;
  const toTime = new Date(Date.now() - page * count * 60000).toISOString();
  const url =
    type === "minutes"
      ? `https://api.upbit.com/v1/candles/${type}/${value}?market=KRW-BTC&count=${count}&to=${toTime}`
      : `https://api.upbit.com/v1/candles/${type}?market=KRW-BTC&count=${count}&to=${toTime}`;

  const cacheKey = `${interval}-${page}`;
  const cachedData = await loadData(cacheKey);

  if (cachedData) {
    if (setData) setData(cachedData);
    return cachedData;
  }

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

    await saveData(cacheKey, transformedData);
    if (setData) setData(transformedData);
    return transformedData; // transformedData 반환
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

export const calculateBollingerBands = (
  data,
  windowSize = BOLLINGER_BAND_PERIOD,
  numStdDev = BOLLINGER_BAND_STD_DEV
) => {
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

export const calculateMovingAverage = (data, period) => {
  return data
    .map((d, i, arr) => {
      if (i < period - 1) {
        return null;
      }
      const sum = arr.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
      return { date: d.date, value: sum / period };
    })
    .filter((d) => d !== null);
};

export const drawChart = ({
  svgRef,
  data,
  interval,
  bollingerBandsSettings,
  movingAverageSettings,
  setTooltipData,
}) => {
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

  bollingerBandsSettings.forEach((setting) => {
    const bollingerBands = calculateBollingerBands(data, setting.period, setting.stddev);

    const area = d3
      .area()
      .x((d) => x(d.date))
      .y0((d) => y(d.upperBand))
      .y1((d) => y(d.lowerBand));

    svg.append("path").datum(bollingerBands).attr("fill", setting.color).attr("opacity", 0.1).attr("d", area);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.middleBand));

    svg
      .append("path")
      .datum(bollingerBands)
      .attr("fill", "none")
      .attr("stroke", setting.color)
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
      .attr("stroke", setting.color)
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
      .attr("stroke", setting.color)
      .attr("stroke-width", 1.5)
      .attr("d", lowerLine);
  });

  movingAverageSettings.forEach((setting) => {
    const movingAverage = calculateMovingAverage(data, setting.period);
    const movingAverageLine = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    svg
      .append("path")
      .datum(movingAverage)
      .attr("fill", "none")
      .attr("stroke", setting.color)
      .attr("stroke-width", 1.5)
      .attr("d", movingAverageLine);
  });

  const focus = svg.append("g").attr("class", "focus").style("display", "none");

  focus
    .append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("stroke", "black") // 선 색상을 검정색으로 설정
    .attr("stroke-width", 1) // 선 너비를 1로 설정
    .attr("y1", 0)
    .attr("y2", height);

  focus
    .append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("stroke", "black") // 선 색상을 검정색으로 설정
    .attr("stroke-width", 1) // 선 너비를 1로 설정
    .attr("x1", 0)
    .attr("x2", width);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("border", "1px solid #d3d3d3")
    .style("padding", "10px")
    .style("display", "none");

  svg
    .append("rect")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", () => {
      focus.style("display", null);
      tooltip.style("display", null);
    })
    .on("mouseout", () => {
      focus.style("display", "none");
      tooltip.style("display", "none");
    })
    .on("mousemove", (event) =>
      mousemove(event, filteredData, x, y, focus, setTooltipData, candleWidth, margin, width, height, tooltip, interval)
    );
};

const mousemove = (
  event,
  filteredData,
  x,
  y,
  focus,
  setTooltipData,
  candleWidth,
  margin,
  width,
  height,
  tooltip,
  interval
) => {
  const bisectDate = d3.bisector((d) => d.date).left;
  const mouseX = d3.pointer(event)[0] - margin.left;
  const mouseY = d3.pointer(event)[1] - margin.top;
  const x0 = x.invert(mouseX);
  const i = bisectDate(filteredData, x0, 1);
  const d0 = filteredData[i - 1];
  const d1 = filteredData[i];
  const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

  focus
    .select(".x-hover-line")
    .attr("transform", `translate(${mouseX + margin.left},0)`)
    .attr("y2", height - margin.top - margin.bottom);

  focus
    .select(".y-hover-line")
    .attr("transform", `translate(0,${mouseY + margin.top})`)
    .attr("x2", width - margin.left - margin.right);

  setTooltipData(d);

  const dateFormat = interval.startsWith("minutes") ? d3.timeFormat("%m/%d %H:%M") : d3.timeFormat("%Y-%m-%d");
  tooltip
    .html(`X: ${dateFormat(d.date)}<br>Y: ${d.close}`)
    .style("left", `${d3.pointer(event)[0] + 15}px`)
    .style("top", `${d3.pointer(event)[1] + 15}px`);
};
