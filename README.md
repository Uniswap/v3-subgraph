# Uniswap V3 Subgraph

## Haven specific 
`yarn codegen` Generates types from the mappings

`yarn devnet:build` Looks at devnet addresses in `networks.json` file to build a new `subgraph.yaml`
`yarn testnet:build` Looks at testnet addresses in `networks.json` file to build a new `subgraph.yaml`
`yarn mainnet:build` Looks at mainnet addresses in `networks.json` file to build a new `subgraph.yaml`
`DEPLOY_KEY=<DEPLOY_KEY> yarn deploy` Deploys which network is currently specified in `subgraph.yaml`

In addtion to the addresses in `networks.json`, you will need to specify the `DEPLOY_KEY` from Ormi.
You will also need to update `chains.ts` file with any relevant contract addresses. 

You can run the subgraph node locally using `yarn local:graph:devnet` which will spin up a local graph node in docker and connect to devnet rpc.
Then use `yarn local:create` to create the subgraph and `yarn local:deploy` to deploy it.

You can do this for all the networks. `yarn local:graph:testnet` `yarn local:graph:mainnet` etc.


### Subgraph Endpoint

Synced at: https://thegraph.com/hosted-service/subgraph/ianlapham/uniswap-v3-subgraph?selected=playground

Pending Changes at same URL

### Running Unit Tests

1. Install [Docker](https://docs.docker.com/get-docker/) if you don't have it already
2. Install postgres: `brew install postgresql`
3. `yarn run build:docker`
4. `yarn run test`

### Adding New Chains

1. Create a new subgraph config in `src/utils/chains.ts`. This will require adding a new `<NETWORK_NAME>_NETWORK_NAME` const for the corresponding network.
2. Add a new entry in `networks.json` for the new chain. The network name should be derived from the CLI Name in The Graph's [supported networks documenation](https://thegraph.com/docs/en/developing/supported-networks/). The factory address can be derived from Uniswap's [deployments documentation](https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments).
3. To deploy to Alchemy, run the following command:

```
yarn run deploy:alchemy --
  <SUBGRAPH_NAME>
  --version-label <VERSION_LABEL>
  --deploy-key <DEPLOYMENT_KEY>
  --network <NETWORK_NAME>
```

## Deployed Subgraphs

- [Haven Testnet](https://graph-api.staging.haven1.org/subgraphs/name/uniswap-v3-testnet/graphql)
