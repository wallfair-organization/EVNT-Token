import React from "react";
import { NavLink } from "react-router-dom";
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
