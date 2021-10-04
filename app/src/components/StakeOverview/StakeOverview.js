import { useSelector } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { selectStakes, selectHistory } from '../../state/wallfair/slice'
import TokenLockAbi from '../../config/abi/TokenLock.json'
import { Contract } from '@ethersproject/contracts'
import TxModal from '../TxModal'
import SafeCall from '../SafeContractCall/SafeContractCall'
import BalanceDetails from '../BalanceDetails'
import styles from './styles.module.scss'
import classNames from 'classnames'
import walletImage from '../../data/icons/wallet.png'

const StakeOverview = ({ provider, setter, hash, balances }) => {
  const historyData = useSelector(selectHistory)
  const stakes = useSelector(selectStakes)
  const [blocked, setBlocked] = useState(false)
  const [TXSuccess, setTXSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!modalOpen) {
      setBlocked(false)
      setTXSuccess(false)
    }
  }, [modalOpen])

  let lockValues = []
  for (const lockAddress in stakes) {
    const lockStake = stakes[lockAddress]
    const totalTokensOf = parseFloat(lockStake[0]).toFixed(2)
    const unlockedTokensOf = parseFloat(lockStake[1]).toFixed(2)
    const tokensVested = parseFloat(lockStake[2]).toFixed(2)
    const unlockableTokens = tokensVested - unlockedTokensOf
    lockValues.push(
      <div key={lockAddress} className={styles.balanceWrapper}>
        <div className={styles.balanceDetails}>
          <BalanceDetails
            totalTokensOf={totalTokensOf}
            unlockedTokensOf={unlockedTokensOf}
            unlockableTokens={unlockableTokens}
          />
          <div className={styles.balanceTokens}>
            <div className={styles.balanceMain}>
              <div className={classNames(styles.balanceTitle, styles.titleOne)}>TOTAL TOKENS LOCKED</div>
              <div className={styles.balanceAmount}>
                {parseFloat(totalTokensOf).toFixed(3)} <sup>WFAIR</sup>
              </div>
            </div>
            <div className={styles.balanceMain}>
              <div className={classNames(styles.balanceTitle, styles.titleTwo)}>TOKENS ALREADY CLAIMED</div>
              <div className={styles.balanceAmount}>
                {parseFloat(unlockedTokensOf).toFixed(3)} <sup>WFAIR</sup>
              </div>
            </div>
            <div className={styles.balanceMain}>
              <div className={classNames(styles.balanceTitle, styles.titleThree)}>TOKENS READY TO BE UNLOCKED</div>
              <div className={styles.balanceAmount}>
                {parseFloat(unlockableTokens).toFixed(3)} <sup>WFAIR</sup>
              </div>
            </div>
          </div>
          <div className={styles.buttonActions}>
            <button
              className={styles.unlockButton}
              disabled={unlockableTokens < 1}
              onClick={() => {
                setBlocked(true)
                ReleaseStake({
                  provider,
                  setter,
                  lockAddress,
                  setTXSuccess: setTXSuccess,
                  setBlocked: setBlocked,
                  setModalOpen: setModalOpen
                })
              }}
            >
              Unlock now
            </button>
            <button
              className={styles.transferButton}
              disabled={unlockableTokens < 1}
              onClick={() => {
                setBlocked(true)
                ReleaseStake({
                  provider,
                  setter,
                  lockAddress,
                  setTXSuccess: setTXSuccess,
                  setBlocked: setBlocked,
                  setModalOpen: setModalOpen
                })
              }}
            >
              <img src={walletImage} />
              Transfer to other wallet
            </button>
          </div>
          <div className={styles.timeDetails}>
            <p>Time to full unlock:</p>
            <strong>123 days</strong>
            <p>05 | 07 | 2021</p>
          </div>
        </div>
        <div key={'history' + lockAddress} className={styles.balanceHistory}>
          <div className={styles.historyHeader}>
            <h4>{`Claimed History`}</h4>
            <div className={styles.historyHeaderRightCol}>
              <h4>{`2.000`}</h4>
              <p>WFAIR</p>
            </div>
          </div>
          {historyData[lockAddress]?.map(data => {
            return (
              <div key={data[0]} className={styles.historyRow}>
                <div className={styles.historyHeaderLeftCol}>
                  <h4>{data[0]}</h4>
                  <p>{new Date(data[2] * 1000).toLocaleDateString('en-US')}</p>
                </div>
                <div className={styles.historyHeaderRightCol}>
                  <h4>{parseFloat(data[1]).toFixed(3)}</h4>
                  <p>WFAIR</p>
                </div>
              </div>
            )
          }) || <p>No history found</p>}
        </div>
        <hr></hr>
      </div>
    )
  }

  if (lockValues.length === 0) {
    return <div className='Stake'>No Stake found</div>
  }
  return (
    <>
      {modalOpen && (
        <TxModal
          hash={hash}
          blocked={blocked}
          success={TXSuccess}
          setModalOpen={setModalOpen}
          action={'Stake Release'}
        />
      )}
      <div className='Stake'>{lockValues}</div>
    </>
  )
}

export default React.memo(StakeOverview)

const ReleaseStake = ({ provider, setter, lockAddress, setTXSuccess, setBlocked, setModalOpen }) => {
  const tokenLock = new Contract(lockAddress, TokenLockAbi.abi, provider?.getSigner())
  setModalOpen(true)
  tokenLock
    .release() // release locked tokens
    .then(tx => {
      // Waiting for transaction receipt

      SafeCall({
        tx: tx,
        callback: success => {
          console.log('SafeCall -> callback()', success)
          setTXSuccess(success)
          setBlocked(false)
        },
        setter: setter
      })
    })
    .catch(err => {
      // Transaction did fail, unblocking
      console.error(err)
      setTXSuccess(false)
      setBlocked(false)
    })
}
