import { useState, useEffect } from "react";
import { fetchData } from "../utils/chartUtils";

const useChartData = (initialInterval) => {
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState(() => localStorage.getItem("interval") || initialInterval);

  useEffect(() => {
    fetchData(interval, setData);
  }, [interval]);

  useEffect(() => {
    localStorage.setItem("interval", interval);
  }, [interval]);

  return { data, interval, setInterval };
};

export default useChartData;
