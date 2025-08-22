# Uniswap V3 and V3-Tokens Subgraph

## Development

1. Install dependencies
`yarn install`

2. Build a v3 subgraph
`yarn build --network <network> --subgraph-type v3` 

3. Deploy a v3 subgraph
`yarn build --network <network> --subgraph-type v3 --deploy`

4. Build a v3-tokens subgraph
`yarn build --network <network> --subgraph-type v3-tokens`

5. Deploy a v3-tokens subgraph
`yarn build --network <network> --subgraph-type v3-tokens --deploy`

Note: Deployments will fail if there are uncommitted changes in the subgraph. Please commit your changes before deploying.

## Local setup for doma testnet

1. run `yarn start:graph` to start graph node (if you are on a Mac M1 please look at https://github.com/graphprotocol/graph-node for instructions on how to run graph node)
2. once the node is up and running, build the subgraph for doma testnet network, e.g. `yarn build --network doma-testnet --subgraph-type v3 `
3. install graph cli: `npm install -g @graphprotocol/graph-cli@latest`
4. create subgraph in local node: `graph create --node http://localhost:8020 uniswap-v3-doma-testnet`
5. deploy it: `graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 uniswap-v3-doma-testnet v3-subgraph.yaml`
