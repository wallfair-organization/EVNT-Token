import React, { useEffect, useState } from "react";
import WalletConnect from "../WalletButton";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { isMobile } from "../../utils/detection";
import Web3Status from "../Web3Status";

const Header = () => {
  return (
    <>
      <header className="HeaderComponent">
        <NavLink className="HeaderMainLink" to="/">
          WALLFAIR.
        </NavLink>
        <div className="LinkAndWalletWrapper">
          <Web3Status />
        </div>
      </header>
    </>
  );
};

export default React.memo(Header);
