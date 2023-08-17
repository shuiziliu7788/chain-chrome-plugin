import {useEffect, useState} from "react";
import {useStorage} from "@plasmohq/storage/dist/hook";
import type {Account, Fork, ForkRequest, SimulationRequest} from "@/types/tenderly";
import type {ConsumerProps, Contract, Explorer, Method, Router,} from "./typing";
import type {Request} from "@/background/messages/proxy";
import request from "@/utils/request";
import {TestSwapCode} from "@/constant";
import {getContractInfo, getCreationTransaction, getPageAddress, getRouterInfo, unique} from "./utils";
import {parseUnits} from "ethers";

export type Hooks = () => ConsumerProps

const zeroAddress: string = "0x0000000000000000000000000000000000000000"

const balance = parseUnits('1', 32)

const useHooks: Hooks = () => {
    const currentAddress = getPageAddress()
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
        address: currentAddress,
        block_number: 0,
        chain_id: 0,
        suggestion_address: []
    });
    const [tenderly_account, setTenderlyAccount] = useStorage<Account>("tenderly");

    const [forkLoading, setForksLoading] = useState<boolean>(false);

    const [createLoading, setCreateLoading] = useState<boolean>(false);

    const [forks, setForks] = useState<Fork[]>([]);

    const [current_fork, setCurrentFork] = useState<Fork>();

    const fetch = async function <T>(req: Request): Promise<T> {
        if (!tenderly_account || tenderly_account.accountName == "" || tenderly_account.accessKey == "" || tenderly_account.projectName == "") {
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

    const fetchForks = async (): Promise<Fork[]> => {
        setForksLoading(true)
        return fetch<Fork[]>({
            host: `/api/v2/project/{project_slug}/forks`,
            method: 'GET',
        }).then(forks => {
            forks = forks ?? []
            setForks(forks)
            if (!current_fork) {
                let fork = forks.find((f => f.description === currentAddress))
                if (!fork && forks.length > 0) {
                    fork = forks[0]
                }
                setCurrentFork(fork)
            }
            return forks
        }).finally(() => {
            setForksLoading(false)
        })
    }

    const fetchFork = async (id: string): Promise<Fork> => {
        const res = await fetch<{ fork: Fork; }>({
            host: `/api/v2/project/{project_slug}/forks/${id}`,
            method: 'GET',
        });
        return res.fork;
    }

    const createFork = (req: ForkRequest): Promise<Fork> => {
        return new Promise(async (resolve, reject) => {
            setCreateLoading(true)
            try {
                const {fork} = await fetch<{ fork: Fork }>({
                    host: `/api/v2/project/{project_slug}/forks`,
                    method: 'POST',
                    data: req,
                })
                setForks([fork, ...forks])
                // 初始化交易测试合约账户
                setCurrentFork(fork)
                // 自动部署合约
                await fetch<any>({
                    host: `/api/v1/account/{account_name}/project/{project_slug}/fork/${fork.id}/simulate`,
                    method: 'POST',
                    data: {
                        root: fork.head_simulation_id,
                        from: zeroAddress,
                        save: true,
                        input: TestSwapCode,
                        generate_access_list: true,
                        skip_fork_head_update: false,
                        value: balance.toString(),
                        state_objects: {
                            [zeroAddress]: {
                                balance: (balance * 2n).toString()
                            }
                        },
                    },
                })
                resolve(fork)
            } catch (e) {
                reject(e)
            } finally {
                setCreateLoading(false)
            }
        })
    }

    const removeFork = (fork_id: string): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            try {
                await fetch({
                    host: `/api/v2/project/{project_slug}/forks/${fork_id}`,
                    method: 'DELETE',
                })
                await fetchForks()
                if (current_fork && current_fork.id == fork_id) {
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
        simulation.root = (await fetchFork(current_fork.id)).head_simulation_id;

        ["gas_price", "gas"].forEach((key) => {
            const type = typeof simulation[key]

            if ((type !== 'string' && type !== 'number') || simulation[key] == '' || Number(simulation[key]) == 0) {
                delete simulation[key]
                return;
            }

            const bigint = parseUnits(`${simulation[key]}`, key == 'gas' ? 4 : 9);

            if (bigint == 0n) {
                delete simulation[key]
                return
            }

            simulation[key] = key == 'gas' ? Number(bigint.toString()) : bigint.toString()
        });


        // 设置重写区块信息
        if (simulation.block_header) {
            ["number", "timestamp"].forEach((key) => {
                const type = typeof simulation.block_header[key]
                if ((type !== 'string' && type !== 'number') || simulation.block_header[key] == '') {
                    simulation.block_header[key] = null
                    return;
                }
                simulation.block_header[key] = "0x" + parseUnits(`${simulation.block_header[key]}`, 0).toString(16)
            });

            // 都不存在的时候删除
            if (!simulation.block_header.timestamp && !simulation.block_header.number) {
                delete simulation.block_header
            }
        }

        // 判断是否主动增发调用者账号资金
        return fetch<any>({
            host: host,
            method: 'POST',
            data: simulation,
        })
    }

    const getInfo = async () => {
        const c = await getContractInfo(explorer.rpc, contract.address ?? zeroAddress)

        let router: Router

        if (typeof c.router == 'string') {
            router = explorer.router.find((value) => value.address == c.router)
            if (!router) {
                router = await getRouterInfo(explorer.rpc, c.router)
                await setExplorer({
                    ...explorer,
                    router: unique<Router>([router, ...explorer.router], 'address'),
                })
            }
        }

        if (!router && explorer.router.length > 0) {
            router = explorer.router[0]
        }

        setContract((prev): Contract => {
            return {
                ...prev,
                ...c,
                router,
            }
        })

        if (!c.token) {
            return
        }

        const tx = await getCreationTransaction(explorer, contract.address)
        let tokens = [...explorer.tokens]
        let pool

        for (let i = 0; i < tx.pools.length; i++) {
            pool = tx.pools[i]
            tokens = tokens.filter(t => t.address !== pool.address)
        }

        if (pool) {
            await setExplorer({
                ...explorer,
                tokens: [...tx.pools, ...tokens]
            })
        } else {
            pool = explorer.tokens.length > 0 ? explorer.tokens[0] : undefined
        }

        setContract((prev) => {
            return {
                ...prev,
                ...tx,
                pool
            }
        })
    }

    useEffect(() => {
        if (tenderly_account) {
            fetchForks()
        }
    }, [tenderly_account])

    useEffect(() => {
        if (explorer.rpc) {
            getInfo().catch(e => {
                console.log(e)
            })
        }
    }, [explorer.rpc])

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