import identity from 'lodash/identity'
import { useState, useEffect } from 'react'

const defaultOptionjs = {
  hydrate: identity,
  dehydrate: identity,
}

const usePersistState = (initialValue, userOptions) => {
  const { localStorageKey, hydrate, dehydrate } = {
    ...defaultOptionjs,
    ...userOptions,
  }
  const [value, setValue] = useState(() => {
    try {
      const valueFromLS = window.localStorage.getItem(localStorageKey)
      return valueFromLS ? hydrate(JSON.parse(valueFromLS)) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(localStorageKey, JSON.stringify(dehydrate(value)))
  }, [value, localStorageKey, dehydrate])

  return [value, setValue]
}

export default usePersistState
