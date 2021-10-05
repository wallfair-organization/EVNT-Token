import styles from './styles.module.scss'
import { ReactComponent as ConfettiLeft } from '../../../data/icons/confetti-left.svg'
import { ReactComponent as ConfettiRight } from '../../../data/icons/confetti-right.svg'

const Success = ({ setModalOpen }) => {
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Congratulations`}</span>
      <p>{`Your process has been been successfully completed.`}</p>
      <button
        className={styles.keepGoing}
        onClick={() => {
          setModalOpen(false)
        }}
      >
        Keep Going!
      </button>
      <ConfettiLeft className={styles.confettiLeft} />
      <ConfettiRight className={styles.confettiRight} />
    </div>
  )
}

export default Success
