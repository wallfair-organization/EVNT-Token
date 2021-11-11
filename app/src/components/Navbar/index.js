import classNames from 'classnames'
import LogoDemo from '../../data/svg/wallfair-logo.svg'
import style from './styles.module.scss'
import Icon from '../Icon'
import { IconType } from '../Icon/IconType'
import { NavLink } from 'react-router-dom'
// import TelegramButton from '../TelegramButton'

const Navbar = () => {
  const renderNavbarLink = (route, text, isLogo = false) => {
    return (
      <NavLink to={route} activeClassName={isLogo ? null : style.active} className={isLogo ? style.logoLink : null}>
        {text}
      </NavLink>
    )
  }

  // const renderNavButtons = () => {
  //   return (
  //     <div className={style.navbarItems}>
  //       <TelegramButton />
  //     </div>
  //   )
  // }

  return (
    <div className={classNames(style.navbar)}>
      <div className={style.logoMobileWrapper}>
        {renderNavbarLink('/', <Icon iconType={IconType.logoSmall} className={style.logoMobile} />, true)}
      </div>
      <div className={classNames(style.navbarItems, style.hideOnMobile)}>
        {renderNavbarLink('/', <img src={LogoDemo} width={200} alt={'Wallfair'} />, true)}

        <div className={style.linkWrapper}>
          <a href='https://wallfair.io' target='_blank' rel='noreferrer' activeClassName={style.active}>
            Website
          </a>
          <a href='https://wallfair.medium.com/' target='_blank' rel='noreferrer' activeClassName={style.active}>
            Blog
          </a>
        </div>
      </div>

      {/* <div className={style.drawerWrapper}>{renderNavButtons()}</div> */}
    </div>
  )
}

export default Navbar
