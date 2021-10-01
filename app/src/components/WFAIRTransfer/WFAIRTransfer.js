import { ethers } from "ethers";
import addresses from "../../config/constants/addresses";
import WFAIRAbi from "../../config/abi/WFAIRToken.json";
import SafeCall from "../SafeContractCall";

const WFAIRTransfer = ({ provider, setter, tokenAmount, to_address, setBlocked, setTXSuccess, setModalOpen }) => {
  const contractAddress = addresses.Wallfair[provider?._network?.chainId];
  if (!contractAddress) {
    console.log("no contract :)");
    return;
  }
  if (!ethers.utils.isAddress(to_address)) {
    alert("Invalid Address");
    return;
  } else if (tokenAmount === "0") {
    alert("Invalid Token Amount");
    return;
  } else {
    setModalOpen(true);
  }

  provider.getGasPrice().then(async (currentGasPrice) => {
    let gas_price = ethers.utils.formatUnits(currentGasPrice, 9);
    console.log("Gas price in Gwei:", gas_price);

    const signer = provider?.getSigner();
    console.log(signer);
    const wfairToken = new ethers.Contract(contractAddress, WFAIRAbi, signer);

    // .5 => 0.5 || 6. => 6.0
    tokenAmount =
      tokenAmount.split(".")[0] === ""
        ? "0" + tokenAmount
        : tokenAmount.split(".")[1] === ""
        ? tokenAmount + "0"
        : tokenAmount;

    wfairToken
      .transfer(to_address, ethers.utils.parseEther(tokenAmount)) // transfer tokens
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

        // tx.wait()
        //   .catch((err) => {
        //     // receiving receipt
        //     console.error(err)
        //   })
        //   .finally(() => {
        //     setBlocked(false)
        //     setter(tx.hash) // setting state of parent to tx hash for rerender purposes
        //   })
      })
      .catch((err) => {
        // Transaction did fail, unblocking
        setter("Tx Failed");
        setBlocked(false);
      });
  });
};

export default WFAIRTransfer;
