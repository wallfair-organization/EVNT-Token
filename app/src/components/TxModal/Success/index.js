import styles from './styles.module.scss'
import { ReactComponent as ConfettiLeft } from '../../../data/icons/confetti-left.svg'
import { ReactComponent as ConfettiRight } from '../../../data/icons/confetti-right.svg'
import AddTokens from '../../AddTokens'

const Success = ({ setModalOpen, action, setTokenAreaOpen }) => {
  const updateModalAndArea = () => {
    if (setTokenAreaOpen && typeof setTokenAreaOpen === 'function') {
      setTokenAreaOpen(false)
    }
    setModalOpen(false)
  }
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Congratulations`}</span>
      <p>{`Your transaction completed succesfully.`}</p>
      {action === 'Stake Release' && <AddTokens onFutherClick={updateModalAndArea} />}
      <button
        className={styles.keepGoing}
        onClick={() => {
          updateModalAndArea()
        }}
      >
        See Your Tokens!
      </button>
      <ConfettiLeft className={styles.confettiLeft} />
      <ConfettiRight className={styles.confettiRight} />
    </div>
  )
}

export default Success
