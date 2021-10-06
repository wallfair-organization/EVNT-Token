import styles from './styles.module.scss'

const DisconnectButton = ({ library, message = '' }) => {
  return (
    <div className={styles.buttonWrapper}>
      {message && <strong style={{ textAlign: 'center' }}>{message}</strong>}
      <button
        onClick={() => {
          library.provider.close()
        }}
      >
        Disconnect wallet
      </button>
    </div>
  )
}
export default DisconnectButton
