import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './styles.module.scss'

const Logo = () => {
  return (
    <NavLink className={styles.logoTitle} to='/'>
      WALLFAIR<span>.</span>
    </NavLink>
  )
}

export default Logo
