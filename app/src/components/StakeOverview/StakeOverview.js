import { useWeb3React } from '@web3-react/core'
import { useSelector } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { selectStakes, selectHistory, selectBalances } from '../../state/wallfair/slice'
import TokenLockAbi from '../../config/abi/TokenLock.json'
import { currentNetwork, lockInfo } from '../../config/config'
import { Contract } from '@ethersproject/contracts'
import TxModal from '../TxModal'
import SafeCall from '../SafeContractCall/SafeContractCall'
import BalanceDetails from '../BalanceDetails'
import styles from './styles.module.scss'
import classNames from 'classnames'
import { numberWithCommas, shortenAddress } from '../../utils/common'
// import TimeCounter from '../TimeCounter'
// import timerStyles from './timer-styles.module.scss'
import NoStakes from './NoStakes'
import AddTokens from '../AddTokens'
import TransferButton from '../TransferButton'
import { isMetamask } from '../../utils/detection'
import useUniswapPrice from '../../hooks/useUniswapPrice'

const StakeOverview = ({ provider, setter, hash }) => {
  const historyData = useSelector(selectHistory)
  const stakes = useSelector(selectStakes)
  const balances = useSelector(selectBalances)
  const [blocked, setBlocked] = useState(false)
  const [TXSuccess, setTXSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useWeb3React();
  const wfairPrice = useUniswapPrice();

  useEffect(() => {
    if (!modalOpen) {
      setBlocked(false)
      setTXSuccess(false)
    }
  }, [modalOpen])

  const WFAIRBalance = Math.floor(parseFloat(balances['WFAIR']))

  let lockValues = [];
  // let totalUnlockedTokensOf = 0;
  for (const lockAddress in stakes) {
    const lockStake = stakes[lockAddress]
    const totalTokensOf = parseFloat(lockStake[0]).toFixed(2)
    const unlockedTokensOf = parseFloat(lockStake[1]).toFixed(2)
    // totalUnlockedTokensOf += parseFloat(lockStake[1]);
    const tokensVested = parseFloat(lockStake[2]).toFixed(2)
    // take end timestamp
    // const vestingPeriod = lockStake[4] * 1000
    // const fullVestingPeriodDate = new Date(vestingPeriod)
    const unlockableTokens = tokensVested - unlockedTokensOf
    
    const totalTokensMarketValue = parseFloat(wfairPrice * totalTokensOf).toFixed(2);
    const unlockedTokensMarketValue = parseFloat(wfairPrice * unlockedTokensOf).toFixed(2);
    const tokensVestedMarketValue = parseFloat(wfairPrice * unlockableTokens).toFixed(2);

    lockValues.push(
      <div key={lockAddress} className={styles.balanceWrapper}>
        {/* <p className={styles.participationText}>{`Here's your participation in ${lockInfo[lockAddress].name}!`}</p> */}
        <p className={styles.participationText}>{`Overview of your ${lockInfo[lockAddress].name} allocation`}</p>
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
                {numberWithCommas(Math.floor(totalTokensOf))} <sup>WFAIR</sup>
              </div>
              {Math.floor(totalTokensMarketValue) > 0 &&
                <div className={styles.marketValueAmount}>
                  &asymp; {numberWithCommas(Math.floor(totalTokensMarketValue))} <span>USDT</span>{' '}
                  {/* <span className={styles.gains}>%</span> */}
                </div>
              }
            </div>
            <div className={styles.balanceMain}>
              <div className={classNames(styles.balanceTitle, styles.titleTwo)}>TOKENS ALREADY CLAIMED</div>
              <div className={styles.balanceAmount}>
                {numberWithCommas(Math.floor(unlockedTokensOf))} <sup>WFAIR</sup>
              </div>
              {Math.floor(unlockedTokensMarketValue) > 0 &&
                <div className={styles.marketValueAmount}>
                  &asymp; {numberWithCommas(Math.floor(unlockedTokensMarketValue))} <span>USDT</span>{' '}
                </div>
              }
            </div>
            <div className={styles.balanceMain}>
              <div className={classNames(styles.balanceTitle, styles.titleThree)}>TOKENS READY TO BE CLAIMED</div>
              <div className={styles.balanceAmount}>
                {numberWithCommas(Math.floor(unlockableTokens))} <sup>WFAIR</sup>
              </div>
              {Math.floor(tokensVestedMarketValue) > 0 &&
                <div className={styles.marketValueAmount}>
                  &asymp; {numberWithCommas(Math.floor(tokensVestedMarketValue))} <span>USDT</span>{' '}
                  {/* <span className={styles.gains}>%</span> */}
                </div>
              }
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
              Claim {numberWithCommas(Math.floor(unlockableTokens))} WFAIR
            </button>
            {isMetamask && WFAIRBalance > 0 && (<AddTokens/>)}
            <TransferButton
              balance={WFAIRBalance}
              provider={provider}
              hash={hash}
              setter={setter}
              setBlocked={setBlocked}
              showCancel={true}
            />
          </div>
          {/* <div className={styles.timeDetails}>
            <p>Time to full unlock:</p>
            <div className={styles.timeContainer}>
              <TimeCounter endDate={vestingPeriod} externalStyles={timerStyles} />
            </div>
            <p>
              {fullVestingPeriodDate.getDate()} | {fullVestingPeriodDate.getMonth()} |{' '}
              {fullVestingPeriodDate.getFullYear()}
            </p>
          </div> */}
        </div>
        {unlockedTokensOf > 0 && (
          <div key={'history' + lockAddress} className={styles.balanceHistory}>
            <div className={styles.historyHeader}>
              <h4>{`Your Claims So Far`}</h4>
            </div>
            {historyData[lockAddress]?.map(data => {
              return (
                <div key={data[0]} className={styles.historyRow}>
                  <div className={styles.historyHeaderLeftCol}>
                    <h4>
                      <a href={`${currentNetwork.explorer}tx/${data[0]}`} target="_blank" rel="noreferrer">{shortenAddress(data[0])}</a>
                    </h4>
                    <p>{new Date(data[2] * 1000).toLocaleDateString('en-US')}</p>
                  </div>
                  <div className={styles.historyHeaderRightCol}>
                    <h4>{numberWithCommas(Math.floor(data[1]))}</h4>
                    <p>WFAIR</p>
                  </div>
                </div>
              )
            }) || <p>No claims yet</p>}
          </div>
        )}
        <hr></hr>
      </div>
    )
  }

  if (lockValues.length === 0) {
    return (
      <NoStakes
        account={account}
        balance={WFAIRBalance}
        provider={provider}
        hash={hash}
        setter={setter}
        setBlocked={setBlocked}
      />
    )
  }
  return (
    <>
      {modalOpen && (
        <TxModal
          hash={hash}
          blocked={blocked}
          success={TXSuccess}
          setModalOpen={setModalOpen}
          action={'Unlock Tokens'}
          canAddToken={isMetamask}
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
