import { useEffect, useState } from 'react';
import { request, gql } from 'graphql-request';

const UPDATE_INTERVAL = 10000;

const tokenAddr = {
    WFAIR: '0xc6065b9fc8171ad3d29bad510709249681758972',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7'
}

const useUniswapPrice = () => {
    const [currentPrice, setCurrentPrice] = useState(0);

    const fetchTokenPrice = async () => {

        const query = gql`
        {
          pairs(where: { 
            token0: "${tokenAddr.WFAIR}" 
            token1: "${tokenAddr.USDT}"
          }) {
            token0Price
            token1Price
          }
        }
        `
        const result = await request('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', query);
    
        if (!result || !result.pairs || !result.pairs[0]) {
          return null;
        }
    
        const wfairPrice = +result.pairs[0]?.token1Price;
    
        if (typeof wfairPrice === 'number') {
            setCurrentPrice(wfairPrice);
        }
    }

    useEffect(() => {
        let intervalId = setInterval(() => {
            fetchTokenPrice();
        }, UPDATE_INTERVAL);

        return () => clearInterval(intervalId);
    }, [currentPrice]);

    useEffect(() => {
        fetchTokenPrice();
    }, []);

    return currentPrice;
}

export default useUniswapPrice;
