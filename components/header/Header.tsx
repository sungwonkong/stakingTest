import styled from "styled-components";
import { useEffect, useState } from "react";
import web3 from "utils/web3";
import index from "../../pages/index";
function Header() {
  const [loginText, setLoginText] = useState("Connect Wallet");

  useEffect(() => {
    if (window.ethereum.selectedAddress !== undefined) {
      login();
      console.log(window.ethereum.selectedAddress);
    }
  }, []);

  const login = async () => {
    const userAddress: string = await web3.connect();
    const shortAddress =
      userAddress.substring(0, 5) +
      "..." +
      userAddress.substring(userAddress.length - 5);
    setLoginText(shortAddress);
    index;
  };

  return (
    <header>
      <nav
        aria-label="menu nav"
        className="bg-gray-800 pt-2 md:pt-1 pb-1 px-1 mt-0 h-auto fixed w-full z-20 top-0">
        <div className="flex flex-wrap items-center">
          <div className="flex flex-shrink md:w-1/3 justify-center md:justify-start text-white">
            <a href="#" aria-label="Home">
              <span className="text-xl pl-2">
                <i className="em em-grinning"></i>
              </span>
            </a>
          </div>

          <div className="flex flex-1 md:w-1/3 justify-center md:justify-start text-white px-2">
            <span className="relative w-full"></span>
          </div>

          <div className="flex w-full pt-2 content-center justify-between md:w-1/3 md:justify-end">
            <ul className="list-reset flex justify-between flex-1 md:flex-none items-center">
              <li className="flex-1 md:flex-none md:mr-3">
                <div className="relative inline-block">
                  <button
                    className="drop-button text-white py-2 px-2"
                    onClick={login}>
                    {" "}
                    <span className="pr-2">
                      <i className="em em-robot_face"></i>
                    </span>{" "}
                    {loginText}
                  </button>
                  <div
                    id="myDropdown"
                    className="dropdownlist absolute bg-gray-800 text-white right-0 mt-3 p-3 overflow-auto z-30 invisible">
                    <input
                      type="text"
                      className="drop-search p-2 text-gray-600"
                      placeholder="Search.."
                      id="myInput"
                    />
                    <a
                      href="#"
                      className="p-2 hover:bg-gray-800 text-white text-sm no-underline hover:no-underline block">
                      <i className="fa fa-user fa-fw"></i> Profile
                    </a>
                    <a
                      href="#"
                      className="p-2 hover:bg-gray-800 text-white text-sm no-underline hover:no-underline block">
                      <i className="fa fa-cog fa-fw"></i> Settings
                    </a>
                    <div className="border border-gray-800"></div>
                    <a
                      href="#"
                      className="p-2 hover:bg-gray-800 text-white text-sm no-underline hover:no-underline block">
                      <i className="fas fa-sign-out-alt fa-fw"></i> Log Out
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
