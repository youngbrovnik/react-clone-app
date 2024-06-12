import * as d3 from "d3";

const BOLLINGER_BAND_PERIOD = 20;
const BOLLINGER_BAND_STD_DEV = 2;

export const calculateBollingerBands = (data) => {
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
