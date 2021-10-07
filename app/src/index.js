import { Web3ReactProvider } from '@web3-react/core'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './app/store'
import './styles.module.scss'
import * as serviceWorker from './serviceWorker'
import getLibrary from './utils/getLibrary'

const ROOT_ELEMENT = document.getElementById('root')

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
        <Provider store={store}>
          <App />
        </Provider>
    </Web3ReactProvider>
  </React.StrictMode>,
  ROOT_ELEMENT
)

serviceWorker.register()
