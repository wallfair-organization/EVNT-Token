import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import { selectStakes, selectBlockedTx, setBlockedState, setBalance, selectHistory } from "../../state/wallfair/slice";
import addresses from "../../config/constants/addresses";
import TokenLockAbi from "../../config/abi/TokenLock.json";
import { Contract } from "@ethersproject/contracts";
import Spinny from "../Spinner/Spinner";
import { uuidv4 } from "../../utils/misc";
import TxModal from "../TxModal";
import SafeCall from "../SafeContractCall/SafeContractCall";
import { ALL_SUPPORTED_CHAIN_IDS } from "../../constants/chains";

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
  for (const lockNum in stakes) {
    const lockStake = stakes[lockNum];
    if (lockStake.length !== 0) {
      const totalTokensOf = parseFloat(lockStake[0]).toFixed(2);
      const unlockedTokensOf = parseFloat(lockStake[1]).toFixed(2);
      const tokensVested = parseFloat(lockStake[2]).toFixed(2);
      const unlockableTokens = tokensVested - unlockedTokensOf;
      lockValues.push(
        <div key={lockNum}>
          <p>TokenLock: {lockNum}</p>
          <p>totalTokensOf: {parseFloat(lockStake[0]).toFixed(2)}</p>
          <p>unlockedTokensOf: {parseFloat(lockStake[1]).toFixed(2)}</p>
          <p>tokensVested: {parseFloat(lockStake[2]).toFixed(2)}</p>
          <p>Unlockable Tokens: {parseFloat(unlockableTokens).toFixed(2)}</p>
          <button
            className={"ReleaseStakeButton"}
            disabled={unlockableTokens < 1}
            onClick={() => {
              setBlocked(true);
              ReleaseStake({
                provider: provider,
                setter: setter,
                lockNum: lockNum,
                setTXSuccess: setTXSuccess,
                setBlocked: setBlocked,
                setModalOpen: setModalOpen,
              });
            }}
          >
            Release Stake
          </button>
          <div>
            <h4>history</h4>
            {historyData[parseInt(lockNum.replace("Lock", ""))]?.map((lockHistory, lockIdx) => {
              return (
                <div className="HistoryItem" key={lockIdx}>
                  <p>TxNum: {lockIdx}</p>
                  <p>From: {lockHistory[0]}</p>
                  <p>to: {lockHistory[1]}</p>
                </div>
              );
            }) || <p>no history found</p>}
          </div>
          <hr></hr>
        </div>
      );
    }
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

const ReleaseStake = ({ provider, setter, lockNum, setTXSuccess, setBlocked, setModalOpen }) => {
  const lockAddr = addresses.WallfairTokenLock[provider?._network?.chainId][lockNum.split("Lock")[1]];
  const tokenLock = new Contract(lockAddr, TokenLockAbi, provider?.getSigner());
  if (!ALL_SUPPORTED_CHAIN_IDS.includes(provider?._network?.chainId)) {
    return;
  }
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
