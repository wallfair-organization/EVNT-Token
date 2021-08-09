async function increaseTime(duration) {
    const id = Date.now();

    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [duration],
                id,
            },
            (err1, result) => {
                if (err1) {
                    reject(err1);
                    return;
                }
                if (result.error) {
                    reject(`increaseTime not supported, test will fail ${result.error}`);
                }
                web3.currentProvider.send(
                    {
                        jsonrpc: "2.0",
                        method: "evm_mine",
                        id: id + 1,
                    },
                    (err2, res) => (err2 ? reject(err2) : resolve(res)),
                );
            },
        );
    });
}

module.exports = {
    increaseTime
};
