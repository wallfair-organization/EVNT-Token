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

const Home = () => {
  const dispatch = useDispatch()
  const [hash, setHash] = useState('')
  const { active, library, account, chainId } = useWeb3React()
  const balances = useSelector(selectBalances)
  const signer = library?.getSigner()

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
      getStakeValues({ address: address, provider: library, dispatch: dispatch })
      getHistory({
        address,
        chainId,
        dispatch,
        provider: library
      })
    }) // eslint-disable-next-line
  }, [account, library, signer, hash])

  if (!account) {
    return (
      <>
        <h1 style={{ textAlign: 'center' }}>Please connect your Wallet</h1>
      </>
    )
  }

  if (chainId !== currentChainId) {
    return (
      <>
        <h1 style={{ textAlign: 'center' }}>Please change your network to {currentNetwork.label}</h1>
      </>
    )
  }

  return (
    <>
      {hash === 'Tx Failed' && <p>Last Tx Failed, please try again</p>}
      {account && <StakeOverview provider={library} setter={setHash} hash={hash} balances={balances} />}
      {account && <TokenTransfer provider={library} setter={setHash} hash={hash} />}
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

const getStakeValues = async ({ address, provider, dispatch }) => {
  // loop over all lock addresses
  for (const lockAddress of lockAddresses) {
    const tokenLock = new Contract(lockAddress, WFairTokenLockABI.abi, provider)

    const currentTime = Math.ceil(Date.now() / 1000)

    const totalTokensOf = await tokenLock.totalTokensOf(address)
    const unlockedTokensOf = await tokenLock.unlockedTokensOf(address)
    const tokensVested = await tokenLock.tokensVested(address, currentTime)

    if (totalTokensOf.gt(ZERO)) {
      dispatch(
        setStakes({
          lock: lockAddress,
          data: [totalTokensOf, unlockedTokensOf, tokensVested].map(ethers.utils.formatEther)
        })
      )
    }
  }
}

const getBalanceWFAIR = async ({ address, provider }) => {
  const contract = new Contract(WFAIRAddress, WFairABI.abi, provider)
  const balance = await contract.balanceOf(address)

  return ethers.utils.formatEther(balance)
}

export default React.memo(Home)
