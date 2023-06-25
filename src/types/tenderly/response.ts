export interface Sig {
    v: string;
    r: string;
    s: string;
}

export interface Log {
    name: string;
    anonymous: boolean;
    inputs: {
        soltype: {
            name: string;
            type: string;
            storage_location: string;
            components?: any;
            offset: number;
            index: string;
            indexed: boolean;
            simple_type: {
                type: string;
            };
        }
        value: string
    }[];
    raw: {
        address: string;
        topics: string[];
        data: string;
    };
}

export interface Nonce_diff {
    address: string;
    original: string;
    dirty: string;
}

export interface Call {
    hash: string;
    contract_name: string;
    function_pc: number;
    function_op: string;
    absolute_position: number;
    caller_pc: number;
    caller_op: string;
    from: string;
    from_balance?: any;
    to: string;
    to_balance?: any;
    value?: any;
    block_timestamp: string;
    gas: number;
    gas_used: number;
    input: string;
    output: string;
    decoded_output?: any;
    error: string;
    error_op: string;
    error_file_index: number;
    error_line_number: number;
    error_code_start: number;
    error_code_length: number;
    network_id: string;
    calls?: any;
}

export interface Call_trace {
    hash: string;
    contract_name: string;
    function_pc: number;
    function_op: string;
    absolute_position: number;
    caller_pc: number;
    caller_op: string;
    call_type: string;
    from: string;
    from_balance: string;
    to: string;
    to_balance: string;
    value: string;
    block_timestamp: string;
    gas: number;
    gas_used: number;
    intrinsic_gas: number;
    input: string;
    nonce_diff: Nonce_diff[];
    output: string;
    decoded_output?: any;
    error: string;
    error_op: string;
    error_file_index: number;
    error_line_number: number;
    error_code_start: number;
    error_code_length: number;
    network_id: string;
    calls: Call[];
}

export interface Stack_trace {
    file_index: number;
    contract: string;
    name: string;
    line: number;
    error: string;
    code?: any;
    op: string;
    length: number;
}

export interface Nonce_diff {
    address: string;
    original: string;
    dirty: string;
}

export interface Soltype {
    name: string;
    type: string;
    storage_location: string;
    components?: any;
    offset: number;
    index: string;
    indexed: boolean;
}

export interface Raw {
    address: string;
    key: string;
    original: string;
    dirty: string;
}

export interface StateDiff {
    address: string;
    soltype: Soltype;
    original: any;
    dirty: any;
    raw: Raw[];
}

export interface Transaction_info {
    contract_id: string;
    block_number: number;
    transaction_id: string;
    contract_address: string;
    method?: any;
    parameters?: any;
    intrinsic_gas: number;
    refund_gas: number;
    call_trace: Call_trace;
    stack_trace: Stack_trace[];
    logs?: Log[];
    balance_diff?: any;
    nonce_diff: Nonce_diff[];
    state_diff?: StateDiff[];
    raw_state_diff?: any;
    console_logs?: any;
    created_at: string;
}

export interface Error_info {
    error_message: string;
    address: string;
}

export interface Transaction {
    hash: string;
    block_hash: string;
    block_number: number;
    from: string;
    gas: number;
    gas_price: number;
    gas_fee_cap: number;
    gas_tip_cap: number;
    cumulative_gas_used: number;
    gas_used: number;
    effective_gas_price: number;
    input: string;
    nonce: number;
    to: string;
    index: number;
    value: string;
    access_list?: any;
    status: boolean;
    addresses: string[];
    contract_ids: string[];
    network_id: string;
    timestamp: string;
    function_selector: string;
    deposit_tx: boolean;
    system_tx: boolean;
    mint?: any;
    sig: Sig;
    transaction_info: Transaction_info;
    error_message: string;
    error_info: Error_info;
    method: string;
    decoded_input?: any;
    call_trace?: any;
}

export interface Data {
    nonce: number;
}

export interface State_object {
    address: string;
    data: Data;
}

export interface Receipt {
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    blockNumber: string;
    from: string;
    to: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    effectiveGasPrice: string;
    contractAddress?: any;
    logs: any[];
    logsBloom: string;
    status: string;
    type: string;
}

export interface Block_header {
    number: string;
    hash: string;
    stateRoot: string;
    parentHash: string;
    sha3Uncles: string;
    transactionsRoot: string;
    receiptsRoot: string;
    logsBloom: string;
    timestamp: string;
    difficulty: string;
    gasLimit: string;
    gasUsed: string;
    miner: string;
    extraData: string;
    mixHash: string;
    nonce: string;
    baseFeePerGas: string;
    size: string;
    totalDifficulty: string;
    uncles?: any;
    transactions?: any;
}

export interface Simulation {
    id: string;
    project_id: string;
    fork_id: string;
    alias: string;
    internal: boolean;
    hash: string;
    state_objects: State_object[];
    network_id: string;
    block_number: number;
    transaction_index: number;
    from: string;
    to: string;
    input: string;
    gas: number;
    deposit_tx: boolean;
    system_tx: boolean;
    queue_origin: string;
    gas_price: string;
    value: string;
    status: boolean;
    fork_height: number;
    block_hash: string;
    nonce: number;
    origin: string;
    kind: string;
    immutable: boolean;
    receipt: Receipt;
    access_list?: any;
    block_header: Block_header;
    parent_id: string;
    created_at: string;
    timestamp: string;
    branch_root: boolean;
}

export interface Contract_info {
    id: number;
    path: string;
    name: string;
    source: string;
}

export interface Abi {
    type: string;
    name: string;
    constant: boolean;
    anonymous: boolean;
    stateMutability: string;
    inputs: any[];
    outputs?: any;
}

export interface State {
    name: string;
    type: string;
    storage_location: string;
    components?: any;
    offset: number;
    index: string;
    indexed: boolean;
}

export interface Data {
    main_contract: number;
    contract_info: Contract_info[];
    abi: Abi[];
    raw_abi?: any;
    states: State[];
}

export interface Contract {
    id: string;
    contract_id: string;
    balance: string;
    network_id: string;
    public: boolean;
    export: boolean;
    verified_by: string;
    verification_date?: any;
    address: string;
    contract_name: string;
    ens_domain?: any;
    type: string;
    evm_version: string;
    compiler_version: string;
    optimizations_used: boolean;
    optimization_runs: number;
    libraries?: any;
    data: Data;
    creation_block: number;
    creation_tx: string;
    creator_address: string;
    created_at: string;
    number_of_watches?: any;
    language: string;
    in_project: boolean;
    number_of_files: number;
}

export interface Response {
    transaction: Transaction;
    simulation: Simulation;
    contracts: Contract[];
}