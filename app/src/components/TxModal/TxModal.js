import Modal from '../Modal'
import Waiting from './Waiting'
import Success from './Success'
import Error from './Error'

const TxModal = ({ hash, action, blocked, success, setModalOpen }) => {
  const getModalContent = () => {
    if (blocked) return <Waiting />

    if (hash && hash !== 'Tx Failed') {
      return (
        <div>
          <button
            onClick={() => {
              window.open(`https://rinkeby.etherscan.io/tx/${hash}`, '_blank')
            }}
          >
            Look up on Etherscan
          </button>
        </div>
      )
    }

    if (!blocked) {
      if (success) {
        return <Success setModalOpen={setModalOpen} />
      } else {
        return <Error setModalOpen={setModalOpen} />
      }
    }
  }
  return (
    <Modal isOpen={true} showCloseButton={false}>
      {getModalContent()}
    </Modal>
  )
}

export default TxModal
