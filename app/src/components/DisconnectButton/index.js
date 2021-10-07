import styles from './styles.module.scss'

const DisconnectButton = ({ library, message = '' }) => {
  if (library.provider.close || library.provider.disconnect) {
  }
  return (
    <div className={styles.buttonWrapper}>
      {message && <strong style={{ textAlign: 'center' }}>{message}</strong>}
      {(library.provider.close || library.provider.disconnect) && (
        <button
          onClick={() => {
            library.provider.close()
          }}
        >
          Disconnect wallet
        </button>
      )}
    </div>
  )
}
export default DisconnectButton
