import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/EVNTIcoToken.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
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

    App.setStatus(`Successful mint of ${balance} EVNT to ${this.account}.`);
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
