import styles from './styles.module.scss'
import { ReactComponent as ConfettiLeft } from '../../../data/icons/confetti-left.svg'
import { ReactComponent as ConfettiRight } from '../../../data/icons/confetti-right.svg'

const Success = ({ setModalOpen }) => {
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Congratulations`}</span>
      <p>{`Your transaction completed succesfully.`}</p>
      <button
        className={styles.keepGoing}
        onClick={() => {
          setModalOpen(false)
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
