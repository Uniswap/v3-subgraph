# Uniswap V3 Subgraph

This code is an updated, more accurate, version of the original v3 subgraph. This code fixes issues in TVL, collect events, and more. 

The main difference is that this subgraph does not track data related to positions. The reason is that to track position data accurately, we need to use multiple `eth_calls` within the subgraph mappings - `eth_calls` consume about 60-80% of sync time in the original subgraph. Without these, the subgrpah can be synced in a matter of weeks as opposed to a matter of months. 

More documentation will be coming soon. 

### Subgraph Endpoint 

Synced at: https://thegraph.com/hosted-service/subgraph/ianlapham/v3-minimal

