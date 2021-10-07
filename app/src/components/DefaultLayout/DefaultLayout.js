import Header from '../Header/Header'
// import Footer from '../Footer/Footer'
import styles from './styles.module.scss'

const DefaultLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main className={styles.layoutContainer}>{children}</main>
      {/* <Footer /> */}
    </>
  )
}

export default DefaultLayout
