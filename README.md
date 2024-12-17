# Uniswap V3 Subgraph for Manta Pacific

### Instructions for Testnet
Please check out the (manta-pacific-testnet)[https://github.com/Aperture-Finance/uniswap-v3-subgraph/tree/manta-pacific-testnet] branch and follow the README instructions there.

### Bring up Graph Node for Mainnet

We deploy Docker containers on Amazon Elastic Container Service (ECS).

First, install (Docker Desktop)[https://www.docker.com/products/docker-desktop/].

Second, add Docker bin directory to `PATH`. On Mac with zsh, add the following line to `~/.zprofile`:
```shell
export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin/"
```

Third, if haven't already, create an ECS context with Docker by running
```shell
docker context create ecs ecscontext
```
which creates an ECS context named 'ecscontext'.

That's all the preparation steps. To bring up the graph node, or to update the graph node, run
```shell
cd docker/
docker-compose --context ecscontext --project-name manta-pacific-mainnet-graph-node up
```

To bring down the graph node, run
```shell
cd docker/
docker-compose --context ecscontext --project-name manta-pacific-mainnet-graph-node down
```

To see graph node logs, run
```shell
cd docker/
docker-compose --context ecscontext --project-name manta-pacific-mainnet-graph-node logs
```

You may also make the docker context persist by running
```shell
docker context use ecscontext
```
and then you won't have to pass `--context ecscontext` to `docker-compose` commands.

### Deploy Uniswap V3 Subgraph to the Graph Node for Mainnet

Once the Graph Node is up and runnning, update `package.json` with the graph node url for `create-remote` and `deploy-remote`.
The node url can be obtained by the AWS ECS dashboard. Select the stack and go into one of the three services, e.g. GraphNode.
Go to the 'Networking' tab and grab the url from the 'DNS name' section; it should have a suffix of `.elb.us-west-2.amazonaws.com`.

Then, deploy the subgraph to the node by running
```shell
yarn
yarn run codegen
yarn run build
yarn run create-remote
yarn run deploy-remote
```

A CloudFront proxy has been set up for the mainnet subgraph at https://d2vin613o4opvi.cloudfront.net/. To query the subgraph for a list of pools, try `https://d2vin613o4opvi.cloudfront.net/subgraphs/name/aperture/uniswap-v3/graphql?query=query+getPools+%7B%0A++pools+%7B%0A++++id%0A++++feeTier%0A++++token0+%7B%0A++++++id%0A++++++name%0A++++%7D%0A++++token1+%7B%0A++++++id%0A++++++name%0A++++%7D%0A++%7D%0A%7D`.

### Deploy UniswapV3 Subgraph to the Graph Node for pruned Manta-Pacific-Mainnet
0. If yarn fails, then clone https://github.com/Uniswap/v3-subgraph and apply changes from manta-pacific-mainnet branch (https://github.com/Aperture-Finance/uniswap-v3-subgraph/tree/manta-pacific-mainnet).
1. Install Goldsky's CLI and log in: https://docs.goldsky.com/subgraphs/deploying-subgraphs#install-goldskys-cli-and-log-in
2. yarn && yarn codegen && yarn build
3. goldsky subgraph deploy --path . pruned-manta-pacific-mainnet/0.0.1

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
