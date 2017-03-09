# Etherchain Light
### Portable blockchain explorer for your private Ethereum chain

Etherchain Light is a Ethereum blockchain explorer built with NodeJS and Express. It does not require an external database and retrieves all information on the fly from a backend Parity Ethereum node.

### Features
* Browse blocks, transactions, accounts and contracts
* View pending transactions
* Display contract internal calls (call, create, suicide)
* Verify contract sources
* Named accounts

## Usage notes
This blockchain explorer is intended for private Ethereum chains. As it does not have a dedicated database all data will be retrived on demand from a backend Parity node. Some of those calls are ressource intensive (e.g. retrieval of the full tx list of an account) and do not scale well for acounts with a huge number of transactions. We currently develop the explorer using the Kovan testnet but it will work with every Parity compatible Ethereum network configuration.

### Getting started
1. Setup a nodejs & npm environment
2. Install the latest version of the Parity Ethereum client
3. Start parity using the following options: `parity --chain=<yourchain> --tracing=on --fat-db=on`
4. Clone this repository to your local machine: `https://github.com/gobitfly/etherchain-light`
5. Install all dependencies: `npm install`
6. Adjust the `config.js` file to your local environment
7. Start the explorer: `npm start`
8. Browse to `http://localhost:3000`
