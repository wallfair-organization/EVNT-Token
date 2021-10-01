import React, { lazy } from 'react'
import { Router, Route, Switch } from 'react-router-dom'
import DefaultLayout from './components/DefaultLayout/DefaultLayout'
import ScrollToTop from './components/ScrollToTop'
import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import history from './routerHistory'
import Fallback from './routes/Fallback'
import Web3ReactManager from './components/Web3ReactManager'

const Home = lazy(() => import('./routes/Home'))
const NotFound = lazy(() => import('./routes/NotFound'))

const SafeApp = () => {
  return (
    <Router history={history}>
      <SuspenseWithChunkError fallback={<Fallback />}>
        <Web3ReactManager>
          <ScrollToTop />
          <DefaultLayout>
            <Switch>
              <Route path="/" exact component={Home} />
              <Route component={NotFound} />
            </Switch>
          </DefaultLayout>
        </Web3ReactManager>
      </SuspenseWithChunkError>
    </Router>
  )
}

export default SafeApp
