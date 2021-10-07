import React from 'react'

const BalanceSection = ({ ETH, WFAIR }) => {
  return (
    <div className='Balance'>
      {ETH && <h1>ETH Balance: {parseFloat(ETH).toFixed(3)}</h1>}
      {WFAIR && <h1>WFAIR Balance: {parseFloat(WFAIR).toFixed(3)}</h1>}
    </div>
  )
}

export default React.memo(BalanceSection)
