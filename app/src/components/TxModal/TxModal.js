import styled from "styled-components";

const TxModal = ({ hash, action, blocked, success, setModalOpen }) => {
  return (
    <div className={"ModalWrapper"}>
      <div className={"ModalContent"}>
        <p>Waiting until TX is confirmed & mined</p>
        {action && <p>Action: {action}</p>}
        {hash && hash !== "Tx Failed" && <p>TxHash: {hash}</p>}
        {hash && hash !== "Tx Failed" && (
          <div>
            <button
              onClick={() => {
                window.open(`https://rinkeby.etherscan.io/tx/${hash}`, "_blank");
              }}
            >
              Look up on Etherscan
            </button>
          </div>
        )}
        {!blocked && (
          <button
            success={success}
            onClick={() => {
              setModalOpen(false);
            }}
          >
            {success ? "Success" : "Error"}
          </button>
        )}
      </div>
      <div className="ModalBG" />
    </div>
  );
};

export default TxModal;
