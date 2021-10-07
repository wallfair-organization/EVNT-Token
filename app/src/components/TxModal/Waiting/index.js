import Loader from '../../Loader'
import styles from './styles.module.scss'

const Waiting = ({ setModalOpen, hash }) => {
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Waiting for confirmation`}</span>
      <p>{`Until TX is confirmed & mined.`}</p>
      {hash && (
        <>
          <p>
            <strong
              onClick={() => {
                window.open(`https://rinkeby.etherscan.io/tx/${hash}`, '_blank')
              }}
            >
              {hash}
            </strong>
          </p>
          <button
            className={styles.keepGoing}
            onClick={() => {
              window.open(`https://rinkeby.etherscan.io/tx/${hash}`, '_blank')
            }}
          >
            Look up on Etherscan
          </button>
        </>
      )}
      <Loader />
    </div>
  )
}

export default Waiting
