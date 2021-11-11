import React from 'react'
import Web3Status from '../Web3Status'
import styles from './styles.module.scss'
// import Logo from '../Logo'
import Navbar from '../Navbar'
import { ReactComponent as WallfairLogo} from '../../data/svg/wallfair-logo.svg';

const Header = ({ withNavbar = false }) => {
  return (
    <>
      {withNavbar ? (
        <>
          <Navbar />
          <div className={styles.walletWelcome}>
            <Web3Status />
          </div>
        </>
      ) : (
        <header className={styles.header}>
          <WallfairLogo />
          <div className={styles.walletWelcome}>
            <Web3Status />
          </div>
        </header>
      )}
    </>
  )
}

export default React.memo(Header)
