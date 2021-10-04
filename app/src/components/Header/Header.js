import React from 'react'
import { NavLink } from 'react-router-dom'
import Web3Status from '../Web3Status'
import styles from './styles.module.scss'

const Header = () => {
  return (
    <>
      <header className={styles.header}>
        <NavLink className={styles.headerTitle} to='/'>
          WALLFAIR<span>.</span>
        </NavLink>
        <div className={styles.walletWelcome}>
          <Web3Status />
        </div>
      </header>
    </>
  )
}

export default React.memo(Header)
