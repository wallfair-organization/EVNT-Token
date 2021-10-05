import styles from './styles.module.scss'

const Error = ({ setModalOpen }) => {
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Oopssssss`}</span>
      <p>{`Something went wrong.`}</p>
      <button
        className={styles.keepGoing}
        onClick={() => {
          setModalOpen(false)
        }}
      >
        Try Again
      </button>
    </div>
  )
}

export default Error
