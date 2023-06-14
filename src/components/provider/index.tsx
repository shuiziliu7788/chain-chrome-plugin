import type {SimulationRequest} from "@/types/tenderly";
import React from "react";
import type {
    Account,
    ConsumerProps,
    Explorer,
    Fork,
    ForkRequest,
    Method,
    ProviderChildrenProps,
    ProviderProps
} from "./typing";

export const ExplorerContext = React.createContext<ConsumerProps>({
    setExplorer(explorer: Explorer):  Promise<any> {
        throw new Error("Function not implemented.");
    },
    explorer: undefined,
    contract: undefined,
    methods: [],
    setMethods: function (methods: Method[]): Promise<void> {
        throw new Error("Function not implemented.");
    },
    tenderly_account: undefined,
    setTenderlyAccount: function (account: Account): Promise<void> {
        throw new Error("Function not implemented.");
    },
    forks: [],
    current_fork: undefined,
    setCurrentFork: function (f: Fork): void {
        throw new Error("Function not implemented.");
    },
    fetchForks: function (): Promise<Fork[]> {
        throw new Error("Function not implemented.");
    },
    fetchFork: function (id: string): Promise<Fork> {
        throw new Error("Function not implemented.");
    },
    createFork: function (req: ForkRequest): Promise<Fork> {
        throw new Error("Function not implemented.");
    },
    removeFork: function (id: string): Promise<any> {
        throw new Error("Function not implemented.");
    },
    submitSimulation: function (simulation: SimulationRequest): Promise<any> {
        throw new Error("Function not implemented.");
    },
    forkLoading: false,
    createLoading: false,
    decompile_network: ""
});

const ProviderChildren: React.FC<ProviderChildrenProps> = (props) => {
    return <ExplorerContext.Provider
        value={{
            ...props.parentContext,
            ...props,
        }}
    >
        {props.children}
    </ExplorerContext.Provider>;
}

export const ExplorerProvider: React.FC<ProviderProps> & {} = (props) => {
    const context = React.useContext<ConsumerProps>(ExplorerContext);

    return <ProviderChildren
        parentContext={context}
        {...props}
    >
    </ProviderChildren>;
};

export * from "./typing"

export default ExplorerProvider