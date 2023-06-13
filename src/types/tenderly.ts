interface Wallet {
    [key: string]: string
}
export interface Account {
    accountName: string
    accessKey: string
    projectName: string
}

export interface Fork {
    id: string
    json_rpc_url: string
    name: string
    description: string
    network_id: string | number
    accounts: Wallet,
    block_number: number
    head_simulation_id: string
}

export interface ForkRequest {
    name: string
    network_id: number
    description: string
    block_number?: number
}

export interface SimulationRequest {
    root?: string,
    from: string
    gas_limit: string | number
    gas_price: string | number
    input: string
    to?: string
    value: string | number
    save: boolean
    skip_fork_head_update?: boolean
    network_id?: string
    generate_access_list?: boolean
    block_header?: boolean
    block_number?: boolean
    transaction_index?: string
    state_objects?: {
        [key: string]: {
            balance?: string,
            [key: string]: string
        }
    }
}