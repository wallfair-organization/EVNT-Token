import React, { useEffect, useState } from "react";
import usePrevious from "../../hooks/usePrevious";
import { ApplicationModal } from "../../state/application/consts";
import { useModalOpen, useWalletModalToggle } from "../../state/application/hooks";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import { injected } from "../../connectors";
import { isMobile } from "react-device-detect";
import { SUPPORTED_WALLETS } from "../../constants/wallet";
import Modal from "../Modal";
import Option from "./Option";
import PendingView from "./PendingView";

const WALLET_VIEWS = {
  OPTIONS: "OPTIONS",
  ACCOUNT: "ACCOUNT",
  PENDING: "PENDING",
};

const WalletModal = () => {
  const { active, account, connector, activate, error } = useWeb3React();
  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT);
  const [pendingWallet, setPendingWallet] = useState(undefined);
  const [pendingError, setPendingError] = useState(false);
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET);
  const toggleWalletModal = useWalletModalToggle();
  const previousAccount = usePrevious(account);

  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal();
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen]);

  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false);
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [walletModalOpen]);

  const activePrevious = usePrevious(active);
  const connectorPrevious = usePrevious(connector);
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT);
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious]);

  const tryActivation = async (connector) => {
    let name = "";

    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name);
      }
      return true;
    });

    setPendingWallet(connector);
    setWalletView(WALLET_VIEWS.PENDING);

    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined;
    }

    connector &&
      activate(connector, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector);
        } else {
          setPendingError(true);
        }
      });
  };

  const getOptions = () => {
    const isMetamask =
      (window.ethereum && window.ethereum.isMetaMask && !(window.ethereum.isMathWallet || window.ethereum.isMew)) ||
      false;
    const isInjected = window.ethereum ? true : false;
    console.log("metamask?", isMetamask);
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key];

      if (isMobile) {
        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              id={`connect-${key}`}
              header={option.name}
              key={key}
              link={option.href}
              active={option.connector === connector}
              icon={option.iconURL}
              onClick={() => {
                option.connector === connector
                  ? setWalletView(WALLET_VIEWS.ACCOUNT)
                  : !option.href && tryActivation(option.connector);
              }}
            />
          );
        }
        return null;
      }

      if (option.name === "MetaMask" && !isMetamask) {
        return null;
      }

      if (option.name === "Injected" && isMetamask) {
        return null;
      }

      if (option.name === "Injected" && !isInjected) {
        return null;
      }

      if (option.connector === injected) {
        if (!(window.web3 || window.ethereum)) {
          if (option.name === "MetaMask") {
            //TODO: return "install metamask" thingy
          }
        }
      }

      //   // don't return metamask if injected provider isn't metamask
      //   else if (option.name === 'MetaMask' && !isMetamask) {
      //     return null
      //   }
      //   // likewise for generic
      //   else if (option.name === 'Injected' && isMetamask) {
      //     return null
      //   }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            header={option.name}
            key={key}
            link={option.href}
            active={option.connector === connector}
            icon={option.iconURL}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector);
            }}
          />
        )
      );
    });
  };

  const getModalContent = () => {
    if (error) {
      console.error(error);
      return <span>{error instanceof UnsupportedChainIdError ? "WRONG NETWORK" : "ERROR"}</span>;
    }

    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return <span>account details</span>;
    }

    return (
      <div>
        {walletView === WALLET_VIEWS.PENDING ? <PendingView error={pendingError} /> : <div>{getOptions()}</div>}
      </div>
    );
  };

  return (
    <Modal isOpen={walletModalOpen} onDismiss={toggleWalletModal} minHeight={false} maxHeight={90}>
      <div>{getModalContent()}</div>
    </Modal>
  );
};

export default WalletModal;
