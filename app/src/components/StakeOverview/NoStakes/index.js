import TransferButton from '../../TransferButton'
import WarningIcon from '../../../data/icons/warning-yellow.svg'
import styles from './styles.module.scss'

const NoStakes = ({ account, balance, provider, hash, setter, setBlocked }) => {
  return (
    <div className={styles.noStakesWrapper}>
      <img src={WarningIcon} alt={`Information`} className={styles.noStakesImages} />
      <div className={styles.noStakesMessage}>
        <p>Unfortunately we could not find any tokens for you to unlock. Please make sure that the wallet address</p>
        <strong>{account}</strong>
        <p>you used to connect is the same address you used in the IDO or during the private or seed sale</p>
      </div>

      <TransferButton balance={balance} provider={provider} hash={hash} setter={setter} setBlocked={setBlocked} />
    </div>
  )
}

export default NoStakes
