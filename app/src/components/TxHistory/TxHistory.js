import React from "react";
import { useSelector } from "react-redux";
import { selectHistory } from "../../state/wallfair/slice";

const TxHistory = () => {
  const historyData = useSelector(selectHistory);

  const historyTxData = [];
  const bruh = [];
  historyData.forEach((lockHistory, lockIdx) => {
    if (lockHistory.length !== 0) {
      lockHistory.forEach((oneTx, txIdx) => {
        if (!historyTxData[lockIdx]) {
          historyTxData[lockIdx] = [];
        }
        historyTxData[lockIdx].push(
          <div key={txIdx}>
            <p>TxNum: {txIdx}</p>
            <p>From: {oneTx[0]}</p>
            <p>to: {oneTx[1]}</p>
          </div>
        );
      });
    }
    historyTxData.length !== 0 &&
        bruh.push(
          <div key={lockIdx}>
            <p>Lock{lockIdx}:</p>
            {historyTxData}
          </div>
        );
  });
  console.log(bruh);
  return (
    <div className="TxHistorySection">
      <p>History:</p>
      {bruh}
    </div>
  );
};

export default React.memo(TxHistory);
