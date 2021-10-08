import styles from './styles.module.scss'
import TelegramButtonDesktop from '../../data/images/telegram-button.svg'
import TelegramButtonMobile from '../../data/images/telegram-button-mobile.svg'

const TelegramButton = () => {
  return (
    <div className={styles.buttonContainer}>
      <a href='https://t.me/joinchat/gLi7w6CeHlpiNThi' target='_blank' rel='noreferrer'>
        <img src={TelegramButtonDesktop} alt={`Telegram`} className={styles.imgDesktop} />
        <img src={TelegramButtonMobile} alt={`Telegram`} className={styles.imgMobile} />
      </a>
    </div>
  )
}

export default TelegramButton
