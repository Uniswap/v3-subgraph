import * as path from 'path'
import * as fsExtra from 'fs-extra'
const process = require('process')

export enum SUPPORTED {
  ARBITRUM = 'arbitrum-one',
  AVAX = 'avax',
  BASE = 'base',
  CELO = 'celo',
  ETHEREUM = 'ethereum',
  OPTIMISM = 'optimism',
  POLYGON = 'polygon'
}

const CONSTANTS_FILE_NAME = 'constants.ts'
const TEMPLATE_FILE_NAME = 'subgraph.template.yaml'

function main() {
  try {
    const network = process.argv[2]

    if (!network) {
      console.error('no network parameter passed')
      process.exit(-1)
    }

    if (
      network !== SUPPORTED.ARBITRUM &&
      network !== SUPPORTED.AVAX &&
      network !== SUPPORTED.BASE &&
      network !== SUPPORTED.CELO &&
      network !== SUPPORTED.ETHEREUM &&
      network !== SUPPORTED.OPTIMISM &&
      network !== SUPPORTED.POLYGON
    ) {
      console.error(
        'invalid newtork parameter passed, pass either: ',
        SUPPORTED.ARBITRUM,
        SUPPORTED.AVAX,
        SUPPORTED.BASE,
        SUPPORTED.CELO,
        SUPPORTED.ETHEREUM,
        SUPPORTED.OPTIMISM,
        SUPPORTED.POLYGON
      )
      process.exit(-1)
    }

    const cwd = process.cwd()
    console.log('cwd:', cwd)

    console.log('preparing config for network:', network)
    const constantsFilePath = path.join(__dirname + '/../config/' + network + '/' + CONSTANTS_FILE_NAME)
    const templateFilePath = path.join(__dirname + '/../config/' + network + '/' + TEMPLATE_FILE_NAME)
    const constantsOutputPath = path.join(__dirname + '/../src/utils/' + CONSTANTS_FILE_NAME)
    const templateFileOutputPath = path.join(__dirname + '/../' + TEMPLATE_FILE_NAME)

    console.log('constants path:', constantsFilePath, ' to:', constantsOutputPath)
    console.log('template path:', templateFilePath, ' to:', templateFileOutputPath)

    fsExtra.copySync(constantsFilePath, constantsOutputPath)
    fsExtra.copySync(templateFilePath, templateFileOutputPath)
  } catch (error) {
    console.error(error)
  }
}

main()
