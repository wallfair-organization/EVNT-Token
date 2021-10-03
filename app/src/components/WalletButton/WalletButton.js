import { useWeb3React } from "@web3-react/core";
import React from "react";
import { NetworkContextName } from "../../constants/misc";
import { useWalletModalToggle } from "../../state/application/hooks";
import WalletModal from "../WalletModal";

const WalletConnectInner = () => {
  const { account, error } = useWeb3React();
  const toggleWalletModal = useWalletModalToggle();

  const wallet_address = (() => {
    let isMobile = window.innerWidth <= 375;
    if (isMobile) return account?.substr(0, 4) + "..." + account?.substr(account?.length - 2);
    return account?.substr(0, 6) + "..." + account?.substr(account?.length - 4);
  })();

  if (account) {
    // ACCOUNT CONNECTED
    return <div className="WalletDisconnectButton">{wallet_address}</div>;
  } else if (error) {
    // NOT CONNECTED, GOT ERROR
    return <div className="WalletDisconnectButton">{"ERROR:" + error}</div>;
  } else {
    // NOT CONNECTED, CONNECT TO A WALLET
    return (
      <div className="WalletConnectButton" id="connect-wallet" onClick={toggleWalletModal}>
        Connect to a wallet
      </div>
    );
  }
};

const WalletConnect = () => {
  const { active } = useWeb3React();
  const contextNetwork = useWeb3React(NetworkContextName);

  return (
    <>
      <WalletConnectInner />
      {(contextNetwork.active || active) && <WalletModal />}
    </>
  );
};

export default WalletConnect;
