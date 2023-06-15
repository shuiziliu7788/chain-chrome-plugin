export interface Source {
    open: boolean
    code: string
    abi?: string
    implementation?: string
    tag: string[]
}