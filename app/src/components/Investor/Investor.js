import React from "react";

const InvestorSection = ({ address, lockedWalletName }) => {
  return (
    <div className="Investor">
      {address && <h1>{address}</h1>}
      {lockedWalletName && <h4>{lockedWalletName}</h4>}
    </div>
  );
};

export default InvestorSection;
