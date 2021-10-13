import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectBalances } from '../../state/wallfair/slice'
import { numberWithCommas } from '../../utils/common'
import TxModal from '../TxModal'
import WFAIRTransfer from '../WFAIRTransfer'
import styles from './styles.module.scss'

const TokenTransfer = ({ provider, setter, hash, balance, showCancel = false, setTokenAreaOpen }) => {
  const [transferValue, setTransferValue] = useState('0')
  const [transferAddress, setTransferAddress] = useState('')
  const [blocked, setBlocked] = useState(false)
  const currentBalance = useSelector(selectBalances)
  const [TXSuccess, setTXSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setformError] = useState('')

  useEffect(() => {
    if (!modalOpen) {
      setBlocked(false)
      setTXSuccess(false)
    }
  }, [modalOpen])

  if (currentBalance['WFAIR'] === '0.0') {
    return <div className='Transfer'>Insufficient Balance for a Transfer</div>
  }

  return (
    <>
      {modalOpen && (
        <TxModal
          hash={hash}
          blocked={blocked}
          success={TXSuccess}
          setModalOpen={setModalOpen}
          setTokenAreaOpen={setTokenAreaOpen}
          action={'Token Transfer'}
        />
      )}
      <div className={styles.transferWrapper}>
        <strong>{`You can maximally transfer ${numberWithCommas(balance)} token(s)`}</strong>
        {formError && (
          <div className={styles.transferFormErrors}>
            <em>{formError}</em>
          </div>
        )}
        <input
          key='transferAddress'
          placeholder='Recipient Address'
          value={transferAddress}
          onChange={e => setTransferAddress(e.target.value)}
        />
        <input
          key='transferValue'
          placeholder='WFAIR Amount'
          value={transferValue}
          onChange={e => {
            if (e.target.value <= balance) {
              setTransferValue(
                e.target.value
                  .replace(/[^0-9.,]/g, '')
                  .replace(/(,)/g, '.')
                  .replace(/(\..*?)\..*/g, '$1')
              )
            }
          }}
        />
        <div className={styles.buttonWrapper}>
          <button
            className={styles.transferButton}
            onClick={() => {
              setBlocked(true)
              setformError('')
              WFAIRTransfer({
                provider: provider,
                setter: setter,
                tokenAmount: transferValue,
                to_address: transferAddress,
                setBlocked: setBlocked,
                setModalOpen: setModalOpen,
                setTXSuccess: setTXSuccess,
                setformError: setformError
              })
            }}
          >
            Send Transaction
          </button>

          {showCancel && (
            <button
              className={styles.cancelButton}
              onClick={() => {
                setformError('')
                setTokenAreaOpen('')
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default React.memo(TokenTransfer)
