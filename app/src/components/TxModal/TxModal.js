import Modal from '../Modal'
import Waiting from './Waiting'
import Success from './Success'
import Error from './Error'

const TxModal = ({ hash, action, blocked, success, setModalOpen, setTokenAreaOpen }) => {
  const getModalContent = () => {
    if (blocked) return <Waiting hash={hash} />
    if (!blocked) {
      if (success) {
        return <Success setModalOpen={setModalOpen} action={action} setTokenAreaOpen={setTokenAreaOpen} />
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
