import LOADER from '../../data/icons/loader.svg'
import styles from './styles.module.scss'

const Loader = () => {
  return (
    <div className={styles.loading}>
      <img src={LOADER} alt={`Loading`} />
    </div>
  )
}

export default Loader
