import { useEnsName, useEnsAvatar } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { normalize } from 'viem/ens'

export function useENSProfile(address?: string) {
    const { data: ensName, isLoading: ensLoading, error: ensError } = useEnsName({
        address: address as `0x${string}`,
        chainId: mainnet.id,
    })

    const { data: avatar, error: avatarError } = useEnsAvatar({
        name: ensName ? normalize(ensName) : undefined,
        chainId: mainnet.id,
    })

    // Better display name logic
    let displayName: string
    if (ensName) {
        displayName = ensName
    } else if (address) {
        displayName = `${address.slice(0, 6)}...${address.slice(-4)}`
    } else {
        displayName = 'Unknown'
    }

    return {
        ensName,
        avatar,
        displayName,
        isLoading: ensLoading
    }
}