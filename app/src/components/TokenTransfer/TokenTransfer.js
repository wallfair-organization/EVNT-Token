import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectBalances } from "../../state/wallfair/slice";
import TxModal from "../TxModal";
import WFAIRTransfer from "../WFAIRTransfer";

const TokenTransfer = ({ provider, setter, hash }) => {
  const [transferValue, setTransferValue] = useState("0");
  const [transferAddress, setTransferAddress] = useState("");
  const [blocked, setBlocked] = useState(false);
  const currentBalance = useSelector(selectBalances);
  const [TXSuccess, setTXSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setBlocked(false);
      setTXSuccess(false);
    }
  }, [modalOpen]);

  if (currentBalance["WFAIR"] === "0.0") {
    return <div className="Transfer">Insufficient Balance for a Transfer</div>;
  }

  return (
    <>
      {modalOpen && (
        <TxModal
          hash={hash}
          blocked={blocked}
          success={TXSuccess}
          setModalOpen={setModalOpen}
          action={"Token Transfer"}
        />
      )}
      <div className="Transfer">
        <label>
          <input
            key="transferAddress"
            placeholder="Recipient Address"
            value={transferAddress}
            onChange={(e) => setTransferAddress(e.target.value)}
          />
        </label>
        <label>
          <input
            key="transferValue"
            placeholder="WFAIR Amount"
            value={transferValue}
            onChange={(e) =>
              setTransferValue(
                e.target.value
                  .replace(/[^0-9.,]/g, "")
                  .replace(/(,)/g, ".")
                  .replace(/(\..*?)\..*/g, "$1")
              )
            }
          />
        </label>
        <button
          className="TransferButton"
          onClick={() => {
            setBlocked(true);
            WFAIRTransfer({
              provider: provider,
              setter: setter,
              tokenAmount: transferValue,
              to_address: transferAddress,
              setBlocked: setBlocked,
              setModalOpen: setModalOpen,
              setTXSuccess: setTXSuccess,
            });
          }}
        >
          Send Transaction
        </button>
      </div>
    </>
  );
};

export default React.memo(TokenTransfer);
