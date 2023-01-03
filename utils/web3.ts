import Web3 from "web3";
import nftConfig from "../config/nftConfig";
import tokenConfig from "../config/tokenConfig";
import stakingconfig from "../config/stakingConfig";

const chainId = "0x5"; //0x5: goeli, ox61 : bscTest

declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
  interface TransactionParam {
    from?: string;
    to?: string;
    data?: string;
    gas?: number;
    value?: string;
  }
}

let _web3: any;
let CryptoonContract: any;
let TokenContract: any;
let StakingContract: any;

const web3 = {
  connect: async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (window.ethereum.chainId !== chainId) {
      web3.chaingeNetwork();
    }

    return accounts[0];
  },

  chaingeNetwork: async () => {
    const accounts = await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: chainId,
        },
      ],
    });
  },

  getABI: () => {
    return nftConfig.abi;
  },
  getAddress: () => {
    return nftConfig.address;
  },
  init: async () => {
    _web3 = new Web3(window.ethereum);
    CryptoonContract = new _web3.eth.Contract(nftConfig.abi, nftConfig.address);
    TokenContract = new _web3.eth.Contract(
      tokenConfig.abi,
      tokenConfig.address,
    );
    StakingContract = new _web3.eth.Contract(
      stakingconfig.abi,
      stakingconfig.address,
    );
  },
  sendTransaction: async (
    name: string,
    stateMutability: string,
    inputs: string,
    contractName: string,
  ) => {
    const CONTRACT = ((name_: string) => {
      name_ = name_.toUpperCase();

      switch (name_) {
        case "CRYPTOON":
          return "CryptoonContract";
        case "TOKEN":
          return "TokenContract";
        case "STAKING":
          return "StakingContract";
        default:
          throw new Error("sendTransaction: Not Correct Contract Name");
      }
    })(contractName);

    const contractConfig = ((name_: string) => {
      name_ = name_.toUpperCase();

      switch (name_) {
        case "CRYPTOON":
          return nftConfig;
        case "TOKEN":
          return tokenConfig;
        case "STAKING":
          return stakingconfig;
        default:
          throw new Error("sendTransaction: Not Correct Contract Name");
      }
    })(contractName);

    try {
      switch (stateMutability) {
        case "view":
          //console.log(`${CONTRACT}.methods.${name}(${inputs}).call()`);
          return await eval(`${CONTRACT}.methods.${name}(${inputs}).call()`);

        case "nonpayable":
        case "payable":
          //console.log(`${CONTRACT}.methods.${name}(${inputs})`);

          const METHOD = eval(`${CONTRACT}.methods.${name}(${inputs})`);
          const params: TransactionParam = {
            from: window.ethereum.selectedAddress,
            to: contractConfig.address,
            data: METHOD.encodeABI(),
          };

          if (stateMutability === "payable") {
            params["value"] =
              "" +
              parseInt(inputs) *
                (await web3.sendTransaction("PRICE", "view", "", "CRYPTOON"));
          }

          const estimateGas: number = await METHOD.estimateGas(params);

          params["gas"] = Math.ceil(estimateGas * 1.2);

          //console.log(params);
          return await _web3.eth.sendTransaction(params);

        default:
          alert("트랜잭션에 실패했습니다.");

          break;
      }
    } catch (err: any) {
      console.log(err.message);
    }
  },

  /// @dev 민팅 함수를 web3로 분리
  mint: async (amount_: number) => {
    const result = await web3.sendTransaction(
      "mint",
      "nonpayable",
      amount_.toString(),
      "CRYPTOON",
    );
    return result;
  },

  /// @dev view 단 값 가져오는 함수
  getInfo: async (name: string) => {
    return await web3.sendTransaction(name, "view", "", "CRYPTOON");
  },

  // sendTran: async (name:string, payable:string, contract:string) => {
  //   return await web3.sendTransaction(name,)
  // },

  setApprovalTest: async (_contract: string) => {
    // CryptoonContract = await new _web3.eth.Contract(
    //   nftConfig.abi,
    //   nftConfig.address,
    // );

    // return CryptoonContract;
    return await web3.sendTransaction(
      "setApprovalForAll",
      "view",
      "",
      "CRYPTOON",
    );
  },

  getBalanceToken: async (_contract: string) => {
    const balance = await _web3.eth.getBalance(_contract);

    return balance;
  },
};

export default web3;
