import styles from './styles.module.scss'
import classNames from 'classnames'
// import LogoDemo from '../../data/images/logo-demo-dot.svg'
import GitHubLogo from '../../data/icons/github.svg'
import FairTradeIcon from '../../data/icons/fair-trade.svg'
import BlockchainIcon from '../../data/icons/blockchain.svg'
import NoMiddleMan from '../../data/icons/no-middle-man.svg'
import OpenSourceIcon from '../../data/icons/open-source.svg'
// import SocialIcons from '../SocialIcons'

const Footer = ({ className = '' }) => {
  return (
    <div className={styles.container}>
      <div className={classNames(styles.footer, className)}>
        {/* <img src={LogoDemo} width={150} alt={'Wallfair'} /> */}

        <div className={styles.links}>
          <div className={styles.column}>
            <div className={styles.firstRow}>

              {/* <a href='https://wallfair.gitbook.io/wallfair/' target='_blank' rel='noreferrer'>
                Documentation
              </a> */}

              <a href='https://wallfair.io/about-us' target='_blank' rel='noreferrer'>
                Career
              </a>
            
            {/* </div>
            <div className={styles.firstRow}> */}

              {/* <a href='https://app.uniswap.org/#/swap' target='_blank' rel='noreferrer'>
                Buy WFAIR tokens
              </a> */}

              <a href='https://github.com/wallfair-organization' target='_blank' rel='noreferrer'>
                <img src={GitHubLogo} width={18} alt={'Github Logo'} />
                Source Code
              </a>
            </div>
          </div>
        </div>

        {/* <SocialIcons className={styles.socialIcons} /> */}
      </div>

      <div className={classNames(styles.iconsContainer, className)}>
        <div className={styles.icon}>
          <img src={FairTradeIcon} alt='Fair trade icon' />
          <span>100% fair</span>
        </div>
        <div className={styles.icon}>
          <img src={OpenSourceIcon} alt='Open source icon' />
          <span>Open source</span>
        </div>
        <div className={styles.icon}>
          <img src={BlockchainIcon} alt='Blockchain icon' />
          <span>Blockchain</span>
        </div>
        <div className={styles.icon}>
          <img src={NoMiddleMan} alt='No middle man icon' />
          <span>No middle man</span>
        </div>
      </div>
    </div>
  )
}

export default Footer
