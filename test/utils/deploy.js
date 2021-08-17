const EVNTToken = artifacts.require('EVNTToken');

export async function deployEVNT(allocation) {
    return EVNTToken.new(
        allocation.map(({ address }) => address),
        allocation.map(({ amount }) => amount),
    )
}