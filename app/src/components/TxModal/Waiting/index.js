import Loader from '../../Loader'
import styles from './styles.module.scss'

const Waiting = ({ setModalOpen }) => {
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Waiting for confirmation`}</span>
      <p>{`Until TX is confirmed & mined.`}</p>
      <Loader />
    </div>
  )
}

export default Waiting
