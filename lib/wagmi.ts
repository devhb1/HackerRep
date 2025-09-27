import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, base } from 'wagmi/chains'

export const config = getDefaultConfig({
    appName: 'HackerRep',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [mainnet, polygon, base],
    ssr: true,
})