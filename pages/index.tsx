import type { NextPage } from "next";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import web3 from "utils/web3";
import styled from "styled-components";
import nftConfig from "\bconfig/nftConfig";
import tokenConfig from "\bconfig/tokenConfig";
import stakingConfig from "\bconfig/stakingConfig";
import { toast } from "react-toastify";
import alchemyConfig from "../config/api/alchemyConfig";
import { Network, Alchemy } from "alchemy-sdk";

const Wrapper = styled.div`
  height: 100vh;

  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 5%;
`;

const settings = {
  apiKey: alchemyConfig.apiToken,
  network: Network.ETH_GOERLI,
};

interface NFT {
  title: string;
  image: string;
  id: string;
}

const alchemy = new Alchemy(settings);

const Home: NextPage = () => {
  const [isLogin, setIsLogin] = useState(false); //메타마스크 로그인 여부
  const [address, setAddress] = useState(""); //메타마스크 로그인 주소

  const [token, setToken] = useState<NFT[]>([]); //미스테이킹 개인NFT의 총 정보
  const [tokenStaking, setTokenStaking] = useState<NFT[]>([]); //스테이킹 개인NFT의 총 정보

  const [ipfsCid, setIpfsCid] = useState(""); //IPFS CID
  const [totalCnt, setTotalCnt] = useState(0); //개인이 가진 NFT 총 발행량(미스테이킹)
  const [totalCntStaking, setTotalCntStaking] = useState(0); //개인이 가진 NFT 총 발행량(스테이킹)
  const [renderAmount, setRenderAmount] = useState(3); //한번에 보여줄 NFT 갯수(미스테이킹)
  const [renderAmountStaking, setRenderAmountStaking] = useState(3); //한번에 보여줄 NFT 갯수(스테이킹)

  const [tokenBalance, setTokenBalance] = useState(0); //가지고 있는 리워드 토큰
  const [isApproval, setIsApproval] = useState(false); //approval 여부

  const toastAlert = (_message: string, _isSuccess: boolean) => {
    const message = (message: string) => (
      <div style={{ fontSize: "1.1rem" }}>{message}</div>
    );
    if (_isSuccess) {
      toast(message(_message), { type: "success" });
    } else {
      toast(message(_message), { type: "error" });
    }
  };

  useEffect(() => {
    web3.init();
    if (window.ethereum.selectedAddress !== undefined) {
      login();
      console.log(window.ethereum.selectedAddress);
      isApprovalCheck();
      getMyNFTInfo();
      getMyNFTInfoStaking();
      getTokenBalance();
    }
  }, []);

  const login = async () => {
    if (typeof window.ethereum == "undefined") {
      toastAlert("Meta Mask를 설치해주세요.", false);
      return;
    }

    const userAddress: string = await web3.connect();
    const shortAddress =
      userAddress.substring(0, 5) +
      "..." +
      userAddress.substring(userAddress.length - 5);
    setIsLogin(true);
    setAddress(shortAddress);
  };

  const disconnect = async () => {
    window.ethereum.selectedAddress = "";
    setIsLogin(false);
    setAddress("");
  };

  const mint = async () => {
    try {
      const result = await web3.mint(1);
      console.log(result);
      if (result) {
        toastAlert("민팅성공", true);
        getMyNFTInfo();
      }
    } catch (error: any) {
      console.log(error);
      toastAlert("민팅실패", false);
    }
  };

  const setApprovalForAll = async () => {
    const receipt = await web3.sendTransaction(
      "setApprovalForAll",
      "nonpayable",
      "'" + stakingConfig.address + "'," + "true",
      "CRYPTOON",
    );

    setIsApproval(true);
    console.log(receipt);
  };

  const cancelApprovalForAll = async () => {
    const receipt = await web3.sendTransaction(
      "setApprovalForAll",
      "nonpayable",
      "'" + stakingConfig.address + "'," + "false",
      "CRYPTOON",
    );
    setIsApproval(false);
    console.log(receipt);
  };

  const isApprovalCheck = async () => {
    const receipt = await web3.sendTransaction(
      "isApprovedForAll",
      "view",
      "'" +
        window.ethereum.selectedAddress +
        "'" +
        ",'" +
        stakingConfig.address +
        "'",
      "CRYPTOON",
    );

    setIsApproval(receipt);

    return receipt;
  };

  const staking = async (tokenId: number) => {
    const isApproval = await isApprovalCheck();

    if (!isApproval) {
      setApprovalForAll();
    }

    if (isApproval) {
      try {
        const receipt = await web3.sendTransaction(
          "stakeNFT",
          "nonpayable",
          "" + tokenId + ",1",
          "STAKING",
        );
        console.log(receipt);
        toastAlert("성공1", true);
        getMyNFTInfo();
        getMyNFTInfoStaking();
        getTokenBalance();
      } catch (e) {
        console.log(e);
        toastAlert("실패", false);
      }
    }
  };

  const unStakeNft = async (tokenId: number) => {
    const isApproval = await isApprovalCheck();

    if (!isApproval) {
      setApprovalForAll();
    }

    if (isApproval) {
      try {
        const receipt = await web3.sendTransaction(
          "unStakeNft",
          "nonpayable",
          "" + tokenId + ",1",
          "STAKING",
        );
        console.log(receipt);
        toastAlert("성공2", true);
        getMyNFTInfo();
        getMyNFTInfoStaking();
        getTokenBalance();
      } catch (e) {
        console.log(e);
        toastAlert("실패", false);
      }
    }
  };

  //본인 NFT의 정보 구하기(미스테이킹)
  const getMyNFTInfo = async () => {
    //들고 있는 토큰 번호 구하기
    const receipt = await web3.sendTransaction(
      "tokensOfOwner",
      "view",
      "'" + window.ethereum.selectedAddress + "'",
      "CRYPTOON",
    );

    if (
      typeof window !== "undefined" &&
      receipt !== "undefined" &&
      receipt !== null &&
      receipt !== ""
    ) {
      setTotalCnt(Object.keys(receipt).length);
    }

    //ipfs CID 구하기
    const ipfsRes = await web3.sendTransaction(
      "getIPFSCID",
      "view",
      "0",
      "CRYPTOON",
    );

    setToken([]);
    let url: any, les: any;
    let resOwnerForCollection = {};

    //receipt.map(async (d: any, i: number) => {
    const ipfs = ipfsCid;
    for (const key in receipt) {
      url = "https://" + ipfsRes + ".ipfs.w3s.link/" + receipt[key] + ".json";
      les = await fetch(url).then((response) => response.json());
      les.tokenid = receipt[key];

      //데이터 넣기
      setToken((prev) => {
        return [
          ...prev,
          {
            title: les["name"],
            image: les["image"],
            id: receipt[key],
          },
        ];
      });
    }
  };

  //리워드 토큰 발란스 구하기
  const getTokenBalance = async () => {
    //토큰 발란스
    const balance = await await web3.sendTransaction(
      "balanceOf",
      "view",
      "'" + window.ethereum.selectedAddress + "'",
      "TOKEN",
    );
    //console.log("test::::::" + balance / 10 ** 18);
    setTokenBalance(balance / 10 ** 18);
  };

  //staking된 nft 구하기
  const getMyNFTInfoStaking = async () => {
    const ipfsRes = await web3.sendTransaction(
      "getIPFSCID",
      "view",
      "0",
      "CRYPTOON",
    );

    //스테이킹된 토큰 번호 구하기
    const receipt = await web3.sendTransaction(
      "tokensOfOwner",
      "view",
      "'" + window.ethereum.selectedAddress + "'",
      "STAKING",
    );

    if (
      typeof window !== "undefined" &&
      receipt !== "undefined" &&
      receipt !== null &&
      receipt !== ""
    ) {
      setTotalCntStaking(Object.keys(receipt).length);
    }

    setTokenStaking([]);
    let url: any, les: any;
    let resOwnerForCollection = {};
    const ipfs = ipfsCid;

    for (const key in receipt) {
      const tokenNumber = receipt[key];
      url = "https://" + ipfsRes + ".ipfs.w3s.link/" + receipt[key] + ".json";
      les = await fetch(url).then((response) => response.json());
      les.tokenid = receipt[key];
      //console.log(les);

      //데이터 넣기
      setTokenStaking((prev) => {
        return [
          ...prev,
          {
            title: String(les["name"]),
            image: String(les["image"]),
            id: String(receipt[key]),
          },
        ];
      });
    }
  };
  /**
   * =============================================================================================================
   * 화면 그리기
   * =============================================================================================================
   */
  //NFT 그리기
  function RenderToken(props: any) {
    const image: string = props.token.image ?? "/img/nft/1.png";

    const [hasWindow, setHasWindow] = useState(false);

    const imgURI =
      "https://" + image.replace("ipfs://", "").replace("/", ".ipfs.w3s.link/");

    useEffect(() => {
      if (typeof window !== "undefined") {
        setHasWindow(true);
      }
    }, []);

    return (
      <div
        className="flex flex-col justify-center items-center"
        style={{ width: "50%" }}>
        <div className="player-wrapper rounded-lg overflow-hidden relative w-full">
          {hasWindow && (
            <Image
              src={imgURI}
              alt={`nft_${props.token.tokenId}`}
              width={1000}
              height={1000}
              objectFit="contain"
              style={{
                borderRadius: "1rem",
              }}
              //onLoad={() => console.log(token.tokenId, " : complete")}
              className="rounded-lg overflow-hidden"
              unoptimized={true}
              loading="lazy"
            />
          )}
        </div>
        <div className="flex w-full mt-3 font-montserrat text-[15px] text-[#270a5e] leading-loose font-bold">
          {props.token.title}
        </div>
        <div className="flex w-full mt-7 justify-center items-center">
          {props.stakedYn == "false" ? (
            <button
              className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
              onClick={() => {
                if (isApproval) {
                  staking(Number(props.token.id));
                } else {
                  setApprovalForAll();
                }
              }}>
              {isApproval ? "staking" : "Approve"}
            </button>
          ) : (
            <button
              className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
              onClick={() => {
                if (isApproval) {
                  unStakeNft(Number(props.token.id));
                } else {
                  setApprovalForAll();
                }
              }}>
              {isApproval ? "unStaking" : "Approve"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Wrapper style={{ marginTop: "5%" }}>
      {isLogin ? (
        <button
          className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
          onClick={mint}>
          MINT
        </button>
      ) : (
        <button
          className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
          onClick={login}>
          Wallet Login
        </button>
      )}
      {isLogin ? (
        <div>
          {address}
          <button className="btn btn-xs" onClick={disconnect}>
            disconnect
          </button>
        </div>
      ) : (
        <div></div>
      )}
      <button
        className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
        onClick={async () => {
          const v = await isApprovalCheck();
          alert(v);
        }}>
        isApproval
      </button>

      <button
        className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
        onClick={() => {
          getTokenBalance();
        }}>
        reward token : {tokenBalance.toFixed(2)}
      </button>

      <a href={"https://app.uniswap.org/#/swap"}>
        <button className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full">
          go to swap
        </button>
      </a>

      {/* <br />
      <br />
      <button
        className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
        onClick={setApprovalForAll}>
        setApprovalForAll
      </button>
      <button
        className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
        onClick={cancelApprovalForAll}>
        cancelApprovalForAll
      </button>
      <button
        className="bg-green-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full"
        onClick={async () => {
          const v = await isApprovalCheck();
          toastAlert(String(v), v);
        }}>
        isApproval
      </button> */}

      <br />
      <br />
      <div className="w-full flex justify-center">
        <button className="bg-red-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full">
          가지고 있는 NFT
        </button>
      </div>
      <div className="grid grid-cols-3 w-full gap-5 mt-5 mb-5 lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-3">
        {token.map((d: any, i) => {
          const name = d.title;
          //console.log(d.title);
          return i < renderAmount ? (
            <div key={d.id}>
              <RenderToken token={d} stakedYn="false" />
            </div>
          ) : (
            <div key={name} className="absolute top-0"></div>
          );
        })}
      </div>

      <div className="w-full flex justify-center">
        {renderAmount < totalCnt ? (
          <button
            onClick={() => {
              setRenderAmount((prev) => prev + 3);
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            }}>
            View More
          </button>
        ) : (
          <></>
        )}
      </div>

      <div className="w-full flex justify-center">
        <button className="bg-red-700 hover:bg-green-900 text-white font-bold py-2 px-4 btn-wide rounded-full">
          스테이킹한 NFT
        </button>
      </div>

      <div className="grid grid-cols-3 w-full gap-5 mt-5 mb-5 lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-3">
        {tokenStaking.map((d: any, i) => {
          const name = d.title;
          //console.log(d.title);
          return i < renderAmountStaking ? (
            <div key={d.id}>
              <RenderToken token={d} stakedYn="true" />
            </div>
          ) : (
            <div key={name} className="absolute top-0"></div>
          );
        })}
      </div>

      <div className="w-full flex justify-center">
        {renderAmount < totalCntStaking ? (
          <button
            onClick={() => {
              setRenderAmountStaking((prev) => prev + 3);
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            }}>
            View More
          </button>
        ) : (
          <></>
        )}
      </div>
    </Wrapper>
  );
};

export default Home;
