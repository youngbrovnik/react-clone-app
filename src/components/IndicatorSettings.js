import React from "react";

const IndicatorSettings = ({
  bollingerBandsSettings,
  movingAverageSettings,
  handleBollingerBandSettingChange,
  handleMovingAverageSettingChange,
  removeIndicator,
}) => {
  return (
    <div>
      <p>현재 적용된 지표:</p>
      {bollingerBandsSettings.map((setting, index) => (
        <div key={`bollinger-${index}`}>
          <span>볼린저 밴드</span>
          <label>
            기간:
            <input
              type="number"
              value={setting.period}
              onChange={(e) => handleBollingerBandSettingChange(index, "period", Number(e.target.value))}
            />
          </label>
          <label>
            표준 편차:
            <input
              type="number"
              value={setting.stddev}
              step="0.1"
              onChange={(e) => handleBollingerBandSettingChange(index, "stddev", Number(e.target.value))}
            />
          </label>
          <label>
            색상:
            <input
              type="color"
              value={setting.color}
              onChange={(e) => handleBollingerBandSettingChange(index, "color", e.target.value)}
            />
          </label>
          <button onClick={() => removeIndicator("bollingerBands", index)}>X</button>
        </div>
      ))}
      {movingAverageSettings.map((setting, index) => (
        <div key={`movingAverage-${index}`}>
          <span>이동 평균</span>
          <label>
            기간:
            <input
              type="number"
              value={setting.period}
              onChange={(e) => handleMovingAverageSettingChange(index, "period", Number(e.target.value))}
            />
          </label>
          <label>
            색상:
            <input
              type="color"
              value={setting.color}
              onChange={(e) => handleMovingAverageSettingChange(index, "color", e.target.value)}
            />
          </label>
          <button onClick={() => removeIndicator("movingAverage", index)}>X</button>
        </div>
      ))}
    </div>
  );
};

export default IndicatorSettings;
