import { useWeb3React } from '@web3-react/core'
import { Contract, ethers } from 'ethers'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import TokenTransfer from '../../components/TokenTransfer'
import WFairABI from '../../config/abi/WFAIRToken.json'
import WFairTokenLockABI from '../../config/abi/TokenLock.json'
import { resetState, selectBalances, setBalance, setStakes, setHistory } from '../../state/wallfair/slice'
import { ZERO } from '../../utils/constants'
import StakeOverview from '../../components/StakeOverview/StakeOverview'
import { WFAIRAddress, lockAddresses, currentChainId, currentNetwork } from '../../config/config'
import Loader from '../../components/Loader'

const Home = () => {
  const dispatch = useDispatch()
  const [hash, setHash] = useState('')
  const [stakesLoading, setStakesLoading] = useState(true)
  const { active, library, account, chainId } = useWeb3React()
  const balances = useSelector(selectBalances)
  const signer = library?.getSigner()
  const ETHBalance = parseFloat(balances["ETH"]);

  useEffect(() => {
    dispatch(resetState())
  }, [account, active, dispatch])

  useEffect(() => {
    if (chainId !== currentChainId) return
    signer?.getBalance().then(result => {
      dispatch(
        setBalance({
          symbol: 'ETH',
          amount: ethers.utils.formatEther(result)
        })
      )
    })
    signer?.getAddress().then(address => {
      getBalanceWFAIR({ address: address, provider: library }).then(result => {
        dispatch(
          setBalance({
            symbol: 'WFAIR',
            amount: result
          })
        )
      })
      getStakeValues({ address: address, provider: library, dispatch: dispatch, setStakesLoading: setStakesLoading })

      getHistory({
        address,
        chainId,
        dispatch,
        provider: library
      })
    }) // eslint-disable-next-line
  }, [account, library, signer, hash])

  // do not render further
  if (!account) {
    return (<></>)
  }

  if (chainId !== currentChainId) {
    return (
      <>
        <h2 style={{ textAlign: 'center' }}>Please change your network to {currentNetwork.label}</h2>
        <button
              onClick={() => {
                library.provider.close();
              }}
            >
              Disconnect
            </button>
      </>
    )
  }

  if (account && stakesLoading) {
    return <Loader />
  }

  // TODO: style this: shows when you use account with 0 ether
  // the link is invisible below
  // TODO: {hash === 'Tx Failed' && <p>Last Tx Failed, please try again</p>} remove that, we must handle tx errors in the TxModal modal
  return (
    <>
      {hash === 'Tx Failed' && <p>Last Tx Failed, please try again</p>}
      {ETHBalance < 0.001 &&
        <div>
        You do not have enough Ether in your wallet to unlock or transfer the tokens. If you use Metamask ot Trust Wallet, you can make purchase within the app.
        You can also use <a href="https://global.transak.com/">Transak</a> directly. <br/>
        The amount in range of 100 USD should let you to unlock the WFAIR and make several transfers in order, for example, to trade or stake the WFAIR token.
      </div>
      }

      {account && (
        <StakeOverview
          provider={library}
          setter={setHash}
          hash={hash}
          balances={balances}
          stakesLoading={stakesLoading}
        />
      )}
      {account && <TokenTransfer provider={library} setter={setHash} hash={hash} />}
      {library && <button
              onClick={() => {
                library.provider.close();
              }}
            >
              Disconnect
            </button>}
    </>
  )
}

const getHistory = async ({ address, dispatch, provider }) => {
  for (const lockAddress of lockAddresses) {
    const tokenLock = new Contract(lockAddress, WFairTokenLockABI.abi, provider)
    const filter = tokenLock.filters.LogRelease(address)
    const logs = await tokenLock.queryFilter(filter)
    if (logs.length > 0) {
      let dataArray = []
      for (const entry of logs) {
        const block = await entry.getBlock()
        dataArray.push([entry.transactionHash, ethers.utils.formatEther(entry.args.amount), block.timestamp])
      }
      dispatch(
        setHistory({
          lock: lockAddress,
          data: dataArray
        })
      )
    }
  }
}

const getStakeValues = async ({ address, provider, dispatch, setStakesLoading }) => {
  // loop over all lock addresses
  for (const lockAddress of lockAddresses) {
    const tokenLock = new Contract(lockAddress, WFairTokenLockABI.abi, provider)
    const totalTokensOf = await tokenLock.totalTokensOf(address)

    if (totalTokensOf.gt(ZERO)) {
      const unlockedTokensOf = await tokenLock.unlockedTokensOf(address)
      const currentTime = Math.ceil(Date.now() / 1000)
      const tokensVested = await tokenLock.tokensVested(address, currentTime)
      // start timestamp in seconds
      const startTimestamp = await tokenLock.startTime()
      const vestingPeriod = await tokenLock.vestingPeriod()
      // this is when vesting ends
      const endTimestamp = startTimestamp.add(vestingPeriod)
      const amounts = [totalTokensOf, unlockedTokensOf, tokensVested].map(ethers.utils.formatEther)
      const timestamps = [startTimestamp, endTimestamp, vestingPeriod].map(t => t.toString())

      dispatch(
        setStakes({
          lock: lockAddress,
          data: [...amounts, ...timestamps]
        })
      )
    }
  }

  // change loading state
  setStakesLoading(false)
}

const getBalanceWFAIR = async ({ address, provider }) => {
  const contract = new Contract(WFAIRAddress, WFairABI.abi, provider)
  const balance = await contract.balanceOf(address)

  return ethers.utils.formatEther(balance)
}

export default React.memo(Home)
