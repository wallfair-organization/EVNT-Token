import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import { selectStakes, selectHistory } from "../../state/wallfair/slice";
import TokenLockAbi from "../../config/abi/TokenLock.json";
import { Contract } from "@ethersproject/contracts";
import TxModal from "../TxModal";
import SafeCall from "../SafeContractCall/SafeContractCall";

const StakeOverview = ({ provider, setter, hash }) => {
  const historyData = useSelector(selectHistory);
  const stakes = useSelector(selectStakes);
  const [blocked, setBlocked] = useState(false);
  const [TXSuccess, setTXSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setBlocked(false);
      setTXSuccess(false);
    }
  }, [modalOpen]);

  let lockValues = [];
  for (const lockAddress in stakes) {
    const lockStake = stakes[lockAddress];
    const totalTokensOf = parseFloat(lockStake[0]).toFixed(2);
    const unlockedTokensOf = parseFloat(lockStake[1]).toFixed(2);
    const tokensVested = parseFloat(lockStake[2]).toFixed(2);
    const unlockableTokens = tokensVested - unlockedTokensOf;
    lockValues.push(
      <div key={lockAddress}>
        <p>TokenLock: {lockAddress}</p>
        <p>totalTokensOf: {totalTokensOf}</p>
        <p>unlockedTokensOf: {unlockedTokensOf}</p>
        <p>tokensVested: {tokensVested}</p>
        <p>Unlockable Tokens: {unlockableTokens}</p>
        <button
          className={"ReleaseStakeButton"}
          disabled={unlockableTokens < 1}
          onClick={() => {
            setBlocked(true);
            ReleaseStake({
              provider,
              setter,
              lockAddress,
              setTXSuccess: setTXSuccess,
              setBlocked: setBlocked,
              setModalOpen: setModalOpen,
            });
          }}
        >
          Release Stake
        </button>
        <div key={"history" + lockAddress}>
          <h4>history</h4>
          {historyData[lockAddress]?.map((data) => {
            return (
              <div className="HistoryItem" key={data[0]}>
                <p>TxHash: {data[0]}</p>
                <p>Amount: {parseFloat(data[1]).toFixed(2)}</p>
                <p>to: {(new Date(data[2] * 1000)).toLocaleDateString("en-US")}</p>
              </div>
            );
          }) || <p>no history found</p>}
        </div>
        <hr></hr>
      </div>
    );
  }

  if (lockValues.length === 0) {
    return <div className="Stake">No Stake found</div>;
  }
  return (
    <>
      {modalOpen && (
        <TxModal
          hash={hash}
          blocked={blocked}
          success={TXSuccess}
          setModalOpen={setModalOpen}
          action={"Stake Release"}
        />
      )}
      <div className="Stake">{lockValues}</div>
    </>
  );
};

export default React.memo(StakeOverview);

const ReleaseStake = ({ provider, setter, lockAddress, setTXSuccess, setBlocked, setModalOpen }) => {
  const tokenLock = new Contract(lockAddress, TokenLockAbi.abi, provider?.getSigner());
  setModalOpen(true);
  tokenLock
    .release() // release locked tokens
    .then((tx) => {
      // Waiting for transaction receipt

      SafeCall({
        tx: tx,
        callback: (success) => {
          console.log("SafeCall -> callback()", success);
          setTXSuccess(success);
          setBlocked(false);
        },
        setter: setter,
      });
    })
    .catch((err) => {
      // Transaction did fail, unblocking
      console.error(err);
      setTXSuccess(false);
      setBlocked(false);
    });
};
