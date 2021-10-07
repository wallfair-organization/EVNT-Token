import styles from './styles.module.scss'

const DisconnectButton = ({ library, message = '' }) => {
  return (
    <div className={styles.buttonWrapper}>
      {message && <strong style={{ textAlign: 'center' }}>{message}</strong>}
      {(library.provider.close || library.provider.disconnect) && <button
        onClick={() => {
          if (library.provider.close) {
            library.provider.close();
          } else {
            library.provider.disconnect();
          }
        }}
      >
        Disconnect wallet
      </button>}
    </div>
  )
}
export default DisconnectButton
