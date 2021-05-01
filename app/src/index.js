import Web3 from "web3";
import wallfairTokenArtifact from "../../build/contracts/WallfairToken.json";
import tokenLockArtifact from "../../build/contracts/FriendsTokenlock.json";

const App = {
  web3: null,
  account: null,
  meta: null,
  tokenLock: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();

      const deployedWallfairToken = wallfairTokenArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        wallfairTokenArtifact.abi,
        deployedWallfairToken.address,
      );

      const deployedTokenLock = tokenLockArtifact.networks[networkId];
      this.tokenLock = new web3.eth.Contract(
          tokenLockArtifact.abi,
          deployedTokenLock.address
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error(error);
      console.error("Could not connect to contract or chain.");
    }
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  mintToken: async function() {
    const { mint } = this.meta.methods;
    const input = parseInt(document.getElementById("amount").value);
    const amount = BigInt(input) * BigInt(10 ** 18);
    await mint(amount).send({from: this.account});
    App.setStatus(`Successful mint of ${input} EVNT to ${this.account}.`);
  },

  getBalance: async function() {
    const { balanceOf } = this.meta.methods;
    const balance = await balanceOf(this.account).call({from: this.account});

    App.setStatus(`${balance} EVNT`);
  },

  getFamilyUnlock: async function() {
    const { release } = this.tokenLock.methods;
    const unlock = await release().send({from: this.account});

    App.setStatus(`${unlock}`);
  },

  getFamilyToken: async function() {
    const { token } = this.tokenLock.methods;
    const unlockPercentage = await token().call({from: this.account});

    console.log(unlockPercentage);
    App.setStatus(`${unlockPercentage}`);
  },

  getFamilyUnlockPercentage: async function() {
    const { percentage } = this.tokenLock.methods;
    const unlockPercentage = await percentage().call({from: this.account});

    App.setStatus(`${unlockPercentage / 100}%`);
  }
};

async function load() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    await window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"),);
  }

  App.start();
}

window.App = App;
window.load = load;

window.addEventListener("load", load);
