import Modal from '../Modal'
import Waiting from './Waiting'
import Success from './Success'
import Error from './Error'

const TxModal = ({ hash, action, blocked, success, setModalOpen }) => {
  const getModalContent = () => {
    if (blocked && !(hash && hash !== 'Tx Failed')) return <Waiting />

    // TODO: do not use hash to pass errors! please pass final status separately
    // TODO: we must not close modal when tx fails
    // TODO: when tx fails and hash is available we must show link to etherscan
    // TODO: look up on Etherscan does not show at all, it should look like a link
    // TDONE
    if (hash && hash !== 'Tx Failed') {
      return <Error setModalOpen={setModalOpen} isTxFail={true} hash={hash} />
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
