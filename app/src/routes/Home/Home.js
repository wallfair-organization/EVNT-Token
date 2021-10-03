import { useWeb3React } from "@web3-react/core";
import { Contract, ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Balance from "../../components/Balance";
import TokenTransfer from "../../components/TokenTransfer";
import WFairABI from "../../config/abi/WFAIRToken.json";
import WFairTokenLockABI from "../../config/abi/TokenLock.json";
import {
  resetState,
  selectBalances,
  setBalance,
  setStakes,
  selectHistory,
  setHistory,
} from "../../state/wallfair/slice";
import StakeOverview from "../../components/StakeOverview/StakeOverview";
import addresses from "../../config/constants/addresses";
import { ALL_SUPPORTED_CHAIN_IDS } from "../../constants/chains";

const Home = () => {
  const [hash, setHash] = useState("");
  const dispatch = useDispatch();
  const { active, library, account, chainId } = useWeb3React();
  const balances = useSelector(selectBalances);
  const historyData = useSelector(selectHistory);
  const signer = library?.getSigner();

  useEffect(() => {
    console.log(historyData);
  }, [historyData]);

  useEffect(() => {
    dispatch(resetState());
  }, [account, active, dispatch]);

  useEffect(() => {
    // if ([account, library, signer, hash] === prevDeps) return;
    signer?.getBalance().then((result) => {
      dispatch(
        setBalance({
          symbol: "ETH",
          amount: ethers.utils.formatEther(result),
        })
      );
    });
    signer?.getAddress().then((address) => {
      getBalanceWFAIR({ address: address, provider: library }).then((result) => {
        dispatch(
          setBalance({
            symbol: "WFAIR",
            amount: result,
          })
        );
      });
      getStakeValues({ address: address, provider: library, dispatch: dispatch });
      getHistory({
        address: address,
        chainId: chainId,
        historyData: historyData,
        dispatch: dispatch,
        provider: library,
      });
    }); // eslint-disable-next-line
  }, [account, library, signer, hash]);

  if (!account) {
    return (
      <>
        <h1 style={{ textAlign: "center" }}>Please connect your Wallet</h1>
      </>
    );
  }

  return (
    <>
      <Balance ETH={balances["ETH"]} WFAIR={balances["WFAIR"]} />
      {hash === "Tx Failed" && <p>Last Tx Failed, please try again</p>}
      {account && <StakeOverview provider={library} setter={setHash} hash={hash} />}
      {account && <TokenTransfer provider={library} setter={setHash} hash={hash} />}
    </>
  );
};

const getHistory = async ({ address, chainId, historyData, dispatch, provider }) => {
  for await (const lockAddress of addresses.WallfairTokenLock[chainId]) {
    const index = addresses.WallfairTokenLock[chainId].indexOf(lockAddress);
    const tokenLock = new Contract(lockAddress, WFairTokenLockABI, provider);
    const filter = tokenLock.filters.LogRelease(address);
    tokenLock.queryFilter(filter).then((logs) => {
      if (logs.length !== 0) {
        let dataArray = [];
        logs.forEach((historyTx, i) => {
          dataArray.push([historyTx.address, address]);
        });
        if (historyData[index]?.length !== dataArray.length) {
          dispatch(
            setHistory({
              lock: index,
              data: dataArray,
            })
          );
        }
      }
    });
  }
};

const getStakeValues = async ({ address, provider, dispatch }) => {
  // loop over all lock addresses
  const lockAddresses = addresses.WallfairTokenLock[provider?._network?.chainId] || [];
  for await (const lockAddress of lockAddresses) {
    const index = lockAddresses.indexOf(lockAddress);
    const tokenLock = new Contract(lockAddress, WFairTokenLockABI, provider);

    if (!ALL_SUPPORTED_CHAIN_IDS.includes(provider?._network?.chainId)) {
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);

    const totalTokensOf = ethers.utils.formatEther(await tokenLock.totalTokensOf(address));
    const unlockedTokensOf = ethers.utils.formatEther(await tokenLock.unlockedTokensOf(address));
    const tokensVested = ethers.utils.formatEther(await tokenLock.tokensVested(address, currentTime));

    const stakes = [];
    totalTokensOf !== "0.0" && stakes.push(totalTokensOf, unlockedTokensOf, tokensVested);

    if (stakes.length > 0) {
      dispatch(
        setStakes({
          lock: "Lock" + index,
          data: stakes,
        })
      );
    }
  }
};

const getBalanceWFAIR = async ({ address, provider }) => {
  const contractAddress = addresses.Wallfair[provider?._network?.chainId];
  if (!contractAddress) {
    console.log("no contract :)");
    return "0.0";
  } else {
    console.log("contractAddress", contractAddress);
    const contract = new Contract(contractAddress, WFairABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }
};

export default React.memo(Home);
