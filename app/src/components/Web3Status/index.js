import { isMobile } from "react-device-detect";
import WalletModal from "../WalletModal";
import styled from "styled-components";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import { NetworkContextName } from "../../constants/misc";
import { useWalletModalToggle } from "../../state/application/hooks";

function Web3StatusInner() {
  const { account, connector, error } = useWeb3React();
  const toggleWalletModal = useWalletModalToggle();

  const wallet_address = (() => {
    if (isMobile) return account?.substr(0, 4) + "..." + account?.substr(account?.length - 2);
    return account?.substr(0, 6) + "..." + account?.substr(account?.length - 4);
  })();

  if (account) {
    return <span>{wallet_address}</span>;
  } else if (error) {
    console.log(error);
    return <span>{error instanceof UnsupportedChainIdError ? "WRONG NETWORK" : "ERROR"}</span>;
  } else {
    return (
      <button className="WalletConnectButton" onClick={toggleWalletModal}>
        Connect to a wallet
      </button>
    );
  }
}

export default function Web3Status() {
  const { active, account } = useWeb3React();
  const contextNetwork = useWeb3React(NetworkContextName);

  return (
    <>
      <Web3StatusInner />
      {(contextNetwork.active || active) && <WalletModal />}
    </>
  );
}
