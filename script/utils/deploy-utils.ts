import { exec as execCallback } from 'child_process'
import * as util from 'util'

import { getAlchemyDeploymentParams, getSubgraphName, prepare } from './prepareNetwork'

const exec = util.promisify(execCallback)

export const build = async (network: string, subgraphType: string): Promise<void> => {
  console.log(`Building subgraph for ${network}`)
  console.log(`\n Copying constants & templates for ${network} \n`)
  await prepare(network, subgraphType)
  console.log(`\n Generating manifest for ${network} ${subgraphType} subgraph \n`)
  await exec(
    `cross-env mustache config/${network}/config.json ${subgraphType}-subgraph.template.yaml > ${subgraphType}-subgraph.yaml`
  )
  const { stdout, stderr } = await exec(`graph codegen ${subgraphType}-subgraph.yaml`)
  console.log(stdout)
  console.log(stderr)
}
export const create = async (subgraphType: string) => {
  const subgraphName = getSubgraphName(subgraphType)
  const { node } = getAlchemyDeploymentParams()
  try {
    console.log(`graph create --node ${node} ${subgraphName}`)
    const { stdout } = await exec(`graph create --node ${node} ${subgraphName}`)
    console.log(stdout)
  } catch (e) {
    console.log(e.stdout)
    console.log(e.stderr)
    console.log('Error: Failed to create subgraph. Please try again.')
    process.exit(1)
  }
}
export const deploy = async (subgraphType: string): Promise<void> => {
  try {
    await exec('git diff-index --quiet HEAD -- && git diff --quiet || (exit 1)')
  } catch (e) {
    console.log('Error: You have uncommitted changes. Please commit your changes and try again.')
    process.exit(1)
  }

  const { stdout: gitHash } = await exec('git rev-parse --short HEAD')
  const gitHashString = gitHash.toString().trim()
  const subgraphName = getSubgraphName(subgraphType)
  const { node, ipfs } = getAlchemyDeploymentParams()

  try {
    console.log(
      `graph deploy --node ${node} --ipfs ${ipfs}  --version-label ${gitHashString} ${subgraphName} ${subgraphType}-subgraph.yaml`
    )
    const { stdout, stderr } = await exec(
      `graph deploy --node ${node} --ipfs ${ipfs}  --version-label ${gitHashString} ${subgraphName} ${subgraphType}-subgraph.yaml`
    )
    if (stderr.includes('Subgraph version already exists')) {
      console.log('Subgraph version already exists. Please update the version label and try again.')
    }
    if (stderr.includes('The subgraph version uses a different network.')) {
      console.log(
        `Subgraph with name ${subgraphName} already exists and is deployed with a different network. Please check your network's .subgraph-env.`
      )
    }
    console.log(stdout)
  } catch (e) {
    console.log(e.stdout)
    console.log(e.stderr)
    console.log('Error: Failed to deploy subgraph. Please try again.')
    process.exit(1)
  }
}
