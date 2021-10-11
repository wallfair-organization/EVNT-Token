import styles from './styles.module.scss'
import DepositIcon from '../../data/icons/deposit-white.svg'

const LowBalance = () => {
  return (
    <div className={styles.lowBalanceWrapper}>
      <img src={DepositIcon} alt={`Information`} className={styles.lowBalanceImages} />
      <div className={styles.lowBalanceMessage}>
        <p>
          Ooops, You do not have enough ETH in your wallet to unlock or transfer the tokens. If you use Metamask ot Trust
          Wallet, you can make purchases directly within the app. You can also use{' '}
          <a href='https://global.transak.com/'>Transak</a> directly.
        </p>
        <p>
          The amount in range of 100 USD should let you to unlock the WFAIR and make several transfers in order, for
          example, to trade or stake the WFAIR token.
        </p>
      </div>
    </div>
  )
}

export default LowBalance
