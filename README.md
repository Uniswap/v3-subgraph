# Uniswap V3 Subgraph

### Subgraph Endpoint 

Synced at: https://thegraph.com/hosted-service/subgraph/ianlapham/uniswap-v3-subgraph?selected=playground

Pending Changes at same URL


Subgraph error 1/1, code: SubgraphSyncingFailure, error: transaction bb0cba46a421ff35c2cd3add81bc3110537c3a1cb764ef9d5a81d632027d2ed9: Mapping aborted at ~lib/array.ts, line 118, column 40, with message: Element type must be nullable if array is holey	wasm backtrace:	    0: 0x1b62 - <unknown>!~lib/array/Array<~lib/@graphprotocol/graph-ts/chain/ethereum/ethereum.EventParam>#__get	    1: 0x34f5 - <unknown>!src/utils/staticTokenDefinition/StaticTokenDefinition.fromAddress	    2: 0x3abc - <unknown>!src/utils/token/fetchTokenDecimals	    3: 0x4941 - <unknown>!src/mappings/factory/handlePoolCreated	 in handler `handlePoolCreated` at block #12370687 (561296ab0bbca1238f1d1890c3779103d17651eaccd9e20fb17d1d3e2e2b174d), block_hash: 0x561296ab0bbca1238f1d1890c3779103d17651eaccd9e20fb17d1d3e2e2b174d, block_number: 12370687