import React from 'react'
import Web3Status from '../Web3Status'
import styles from './styles.module.scss'
import Logo from '../Logo'

const Header = () => {
  return (
    <>
      <header className={styles.header}>
        <Logo />
        <div className={styles.walletWelcome}>
          <Web3Status />
        </div>
      </header>
    </>
  )
}

export default React.memo(Header)
