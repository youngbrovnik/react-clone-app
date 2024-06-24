import { useState, useEffect } from "react";
import { fetchData } from "../utils/chartUtils";

const useChartData = (initialInterval) => {
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState(() => localStorage.getItem("interval") || initialInterval);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchData(interval, setData, page);
  }, [interval, page]);

  useEffect(() => {
    localStorage.setItem("interval", interval);
  }, [interval]);

  const loadMoreData = async (direction) => {
    const newPage = direction === "past" ? page + 1 : page - 1;
    if (newPage < 0) return; // 미래 데이터는 음수 페이지가 될 수 없습니다.

    const moreData = await fetchData(interval, null, newPage);
    if (direction === "past") {
      setData((prevData) => [...moreData, ...prevData]);
    } else {
      setData((prevData) => [...prevData, ...moreData]);
    }
    setPage(newPage);
  };

  return { data, interval, setInterval, loadMoreData };
};

export default useChartData;
