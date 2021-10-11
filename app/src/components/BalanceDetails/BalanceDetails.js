import React from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { numberWithCommas } from '../../utils/common'
import styles from './styles.module.scss'

const BalanceDetails = ({ totalTokensOf, unlockedTokensOf, unlockableTokens }) => {
  return (
    <div className={styles.totalBalance}>
      <PieChart
        data={[
          {
            title: `Tokens already claimed`,
            value: unlockedTokensOf,
            color: '#3570ff'
          },
          {
            title: `Tokens ready to be claimed`,
            value: unlockableTokens,
            color: '#2FCD65'
          }
        ]}
        background={`#2a3252`}
        totalValue={totalTokensOf}
        lineWidth={14}
        startAngle={270}
      />
      <div className={styles.overallFundsTotal}>
        <p>{numberWithCommas(Math.floor(totalTokensOf))}</p>
        <span>WFAIR</span>
      </div>
    </div>
  )
}

export default React.memo(BalanceDetails)
