import React from 'react'
import { PieChart } from 'react-minimal-pie-chart'
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
            title: `Tokens ready to be unlocked`,
            value: unlockableTokens,
            color: '#acc4ff'
          }
        ]}
        background={`#2a3252`}
        totalValue={totalTokensOf}
        lineWidth={14}
        startAngle={270}
      />
      <div className={styles.overallFundsTotal}>
        <p>{parseFloat(totalTokensOf).toFixed(3)}</p>
        <span>WFAIR</span>
      </div>
    </div>
  )
}

export default React.memo(BalanceDetails)
