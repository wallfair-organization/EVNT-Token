import SafeProvider from '@gnosis.pm/safe-apps-react-sdk'
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './app/store'
import { NetworkContextName } from './constants/misc'
import './index.css'
import * as serviceWorker from './serviceWorker'
import getLibrary from './utils/getLibrary'

const ROOT_ELEMENT = document.getElementById('root')
const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          {/* <SafeProvider
          loader={
            <>
              <p>Loading...</p>
            </>
          }
        > */}
          <App />
          {/* </SafeProvider> */}
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </React.StrictMode>,
  ROOT_ELEMENT,
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register()
