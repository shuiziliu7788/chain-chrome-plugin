import {useEffect, useState} from "react";
import {address} from "@/utils/regexp";
import {useStorage} from "@plasmohq/storage/dist/hook";
import type {Account, Fork, ForkRequest, SimulationRequest} from "@/types/tenderly";
import type {ConsumerProps, Contract, Explorer, Method} from "./typing";
import type {Request} from "@/background/messages/proxy";
import request from "@/utils/request";
import {info} from "@/components/provider/utils";
import {TestSwapCode} from "@/constant";

export type Hooks = () => ConsumerProps

const zeroAddress = "0x0000000000000000000000000000000000000000"

const useHooks: Hooks = () => {
    const [explorer, setExplorer] = useStorage<Explorer>(location.host, {
        enable: false,
        secret_key: undefined,
        rpc: undefined,
        router: [],
        tokens: []
    });
    const [methods, setMethods] = useStorage<Method[]>("methods", []);
    const [decompile_network] = useStorage<string>("decompile_network");
    const [contract, setContract] = useState<Contract>({
        address: address(document.location.href),
        symbol: '',
        decimals: 18,
        block_number: 0,
        chain_id: 0,
        router: undefined,
        pair: undefined,
        suggestion_address: []
    });

    const [tenderly_account, setTenderlyAccount] = useStorage<Account>("tenderly");
    const [forkLoading, setForksLoading] = useState<boolean>(false);
    const [createLoading, setCreateLoading] = useState<boolean>(false);
    const [forks, setForks] = useState<Fork[]>([]);
    const [current_fork, setCurrentFork] = useState<Fork>();

    const fetch = function <T>(req: Request): Promise<T> {
        if (!tenderly_account) {
            return Promise.reject("请配置Tenderly账号和秘钥")
        }
        req.host = `https://api.tenderly.co${req.host}`.replace("{project_slug}", tenderly_account.projectName).replace("{account_name}", tenderly_account.accountName)
        req.header = {
            'X-Access-Key': tenderly_account.accessKey
        }
        return request<T>(req).then((res: any) => {
            if (res && res.error) {
                throw new Error(res.error.message)
            }
            return res
        })
    }

    const fetchForks = (): Promise<Fork[]> => {
        setForksLoading(true)
        return fetch<Fork[]>({
            host: `/api/v2/project/{project_slug}/forks`,
            method: 'GET',
        }).then(forks => {
            forks = forks ?? []
            setForks(forks)
            if (!current_fork) {
                const regExp = new RegExp(contract.address ?? "0x", "ig");
                const index = forks.findIndex((f) => {
                    return regExp.test(f.description ?? "")
                })
                if (index >= 0) {
                    setCurrentFork(forks[index])
                }
            }
            return forks
        }).finally(() => {
            setForksLoading(false)
        })
    }

    const fetchFork = (id: string): Promise<Fork> => {
        return fetch<{ fork: Fork }>({
            host: `/api/v2/project/{project_slug}/forks/${id}`,
            method: 'GET',
        }).then(res => res.fork)
    }

    const createFork = (req: ForkRequest): Promise<Fork> => {
        return new Promise<Fork>(async (resolve, reject): Promise<Fork> => {
            setCreateLoading(true)
            const {fork} = await fetch<{ fork: Fork }>({
                host: `/api/v2/project/{project_slug}/forks`,
                method: 'POST',
                data: req,
            })
            setForks([fork, ...forks])
            // 初始化交易测试合约账户
            fetch<any>({
                host: `/api/v1/account/{account_name}/project/{project_slug}/fork/${fork.id}/simulate`,
                method: 'POST',
                data: {
                    root: fork.head_simulation_id,
                    from: zeroAddress,
                    save: true,
                    input: TestSwapCode,
                    generate_access_list: true,
                    skip_fork_head_update: false,
                    value: '100000000000000000000000000000000000000000000000',
                    state_objects: {
                        [zeroAddress]: {
                            balance: "100000000000000000000000000000000000000000000000000"
                        }
                    },
                },
            }).catch(e => {
                console.log(e)
            })
            setCurrentFork(fork)
            setCreateLoading(false)
            return fork
        })
    }

    const removeFork = (fork_id: string): Promise<any> => {
        return new Promise(async (resolve, reject) => {
            try {
                await fetch({
                    host: `/api/v2/project/{project_slug}/forks/${fork_id}`,
                    method: 'DELETE',
                })
                await fetchForks()
                if (current_fork && current_fork.id == fork_id){
                    setCurrentFork(undefined)
                }
                resolve(true)
            } catch (e) {
                reject(e)
            }
        })
    }

    const submitSimulation = async (simulation: SimulationRequest): Promise<any> => {
        if (!current_fork) {
            throw new Error("请选择测试节点")
        }
        const host = `/api/v1/account/{account_name}/project/{project_slug}/fork/${current_fork.id}/simulate`
        simulation.root = (await fetchFork(current_fork.id)).head_simulation_id
        return fetch<any>({
            host: host,
            method: 'POST',
            data: simulation,
        })
    }

    useEffect(() => {
        if (tenderly_account) {
            fetchForks().catch(e => {
                console.log("初始化tenderly失败", e)
            })
        }
    }, [tenderly_account])

    useEffect(() => {
        const addr = address(document.location.href)

        if (!explorer || !explorer.rpc) {
            return
        }
        info(explorer.rpc, addr ?? zeroAddress).then(r => {
            if (!r) {
                return
            }
            setContract((prevState) => {
                return {...prevState, ...r}
            })
        }).catch(e => {
            console.log(e)
        })
    }, [explorer])


    return {
        contract,
        methods,
        setMethods,
        forks,
        current_fork,
        setCurrentFork,
        tenderly_account,
        setTenderlyAccount,
        fetchForks,
        fetchFork,
        createFork,
        removeFork,
        submitSimulation,
        forkLoading,
        createLoading,
        decompile_network,
        explorer,
        setExplorer,
    }
}

export default useHooks