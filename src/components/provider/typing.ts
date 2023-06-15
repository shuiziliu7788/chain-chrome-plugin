import {SimulationRequest} from "@/types/tenderly";
import type {Response} from "@/types/tenderly/response";
import React from "react";

export interface Option {
    label?: string
    value?: string
}

export interface Token {
    address: string
    name?: string,
    symbol?: string,
    decimals?: number,
    totalSupply?: string,
}

export interface Contract {
    address?: string,
    block_number: number,
    chain_id?: number,
    owner?: string,
    creator?: string,
    router?: Router | string,
    txHash?: string,
    pool?: Token,
    pools?: Token[],
    token?: Token,
    suggestion_address: Option[],
}

export interface Method {
    id: string
    label: string
    value: string
}

interface Wallet {
    [key: string]: string
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

export interface Account {
    accountName: string
    accessKey: string
    projectName: string
}

export interface ForkRequest {
    name: string
    network_id: number
    description: string
    block_number?: number
}

export interface ConsumerProps {
    contract: Contract
    methods: Method[],
    setMethods: (methods: Method[]) => Promise<void>,
    tenderly_account: Account,
    setTenderlyAccount: (account: Account) => Promise<void>,
    forks: Fork[],
    current_fork: Fork,
    setCurrentFork: (f: Fork) => void,
    fetchForks: () => Promise<Fork[]>,
    fetchFork: (id: string) => Promise<Fork>,
    createFork: (req: ForkRequest) => Promise<Fork>,
    removeFork: (id: string) => Promise<any>,
    submitSimulation: (simulation: SimulationRequest) => Promise<Response>,
    forkLoading: boolean,
    createLoading: boolean,
    decompile_network: string,
    explorer: Explorer,
    setExplorer: (explorer: Explorer) => Promise<any>,
}

export interface ProviderProps extends ConsumerProps {
    children?: React.ReactNode;
}

export interface ProviderChildrenProps extends ProviderProps {
    parentContext?: ProviderProps;
}

export interface Router {
    name?: string
    address: string
    weth?: string
    version?: number
}

export interface Explorer {
    enable: boolean
    rpc: string
    host?: string
    developer_host?: string
    secret_key?: string
    router: Router[],
    tokens: Token[]
}

export type MethodType = "owner" | "pair" | "router"

export interface Dict extends Option {
    type?: MethodType
}