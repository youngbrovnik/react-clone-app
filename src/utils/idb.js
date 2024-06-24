import { openDB } from "idb";

const DB_NAME = "CandleChartDB";
const STORE_NAME = "candles";

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    },
  });
};

export const saveData = async (key, data) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put({ key, data });
  await tx.done;
};

export const loadData = async (key) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const result = await store.get(key);
  await tx.done;
  return result ? result.data : null;
};
