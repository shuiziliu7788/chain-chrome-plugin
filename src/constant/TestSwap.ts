import code from "./code.json"
import {Interface} from "ethers";

export const TestSwapCode = "0x" + code.data.bytecode.object

export const TestSwapIface = new Interface(code.abi);