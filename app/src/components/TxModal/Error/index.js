import styles from './styles.module.scss'

const Error = ({ setModalOpen, isTxFail = false, hash }) => {
  return (
    <div className={styles.promoMessage}>
      <span className={styles.prizeAmount}>{`Oopssssss`}</span>
      <p>{`Your transaction has failed.`}</p>
      {isTxFail ? (
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
      ) : (
        <button
          className={styles.keepGoing}
          onClick={() => {
            setModalOpen(false)
          }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export default Error
