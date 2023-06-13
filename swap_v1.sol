// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface Router {
    function factory() external pure returns (address);

    function WETH() external pure returns (address);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IPancakePair {
    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(address from, address to, uint value) external returns (bool);

    function factory() external view returns (address);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function deposit() external payable;

    function withdraw(uint) external;
}

interface IFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

contract TestSwap {
    uint256 internal id = 0;
    mapping(uint256 => uint256) internal index;

    struct Call {
        address router;
        address tokenIn;
        address tokenOut;
        uint256 buy;
        uint256 sell;
        uint256 transfer;
    }

    struct Detail {
        uint8 state;
        uint256 tokenInBeforeBalance;
        uint256 tokenOutBeforeBalance;
        uint256 tokenInAfterBalance;
        uint256 tokenOutAfterBalance;
        int tokenInFee;
        int tokenOutFee;
        uint256 gas;
        string error;
    }

    struct Result {
        uint id;
        uint index;
        uint256 tokenInBalance;
        uint256 tokenOutBalance;
        uint256 blockNumber;
        uint256 blockTimestamp;
        Detail buy;
        Detail sell;
        Detail transfer;
    }

    constructor() payable {

    }

    function
    SwapV2(address router, address tokenIn, address tokenOut, address to, uint256 amountIn, uint256 amountOut)
    public
    returns (Detail memory detail)
    {
        IPancakePair In = IPancakePair(tokenIn);
        IPancakePair Out = IPancakePair(tokenOut);
        detail = Detail(
            1,
            0,
            0,
            0,
            0,
            10000,
            10000,
            gasleft(),
            ""
        );

        address pair = IFactory(Router(router).factory()).getPair(tokenIn, tokenOut);
        require(pair != address(0), "pool does not exist");
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        if (amountIn == 0 && amountOut != 0) {
            amountIn = Router(router).getAmountsIn(amountOut, path)[0];
        }
        require(amountIn > 0, "tokenIn not be zero");

        if (amountIn > In.balanceOf(pair) * 9999 / 10000) {
            amountIn = In.balanceOf(pair) * 9999 / 10000;
        }

        require(In.balanceOf(address(this)) >= amountIn, "tokenIn Insufficient balance");

        detail.tokenInBeforeBalance = In.balanceOf(address(this));

        In.transfer(pair, amountIn);
        (uint256 reserve0, uint256 reserve1,) = IPancakePair(pair).getReserves();
        if (IPancakePair(pair).token0() == tokenIn) {
            reserve1 = Router(router).getAmountsOut(In.balanceOf(pair) - reserve0, path)[1];
            reserve0 = 0;
        } else {
            reserve0 = Router(router).getAmountsOut(In.balanceOf(pair) - reserve1, path)[1];
            reserve1 = 0;
        }

        detail.tokenInFee = _fee(reserve0 == 0 ? reserve1 : reserve0, amountIn);
        detail.tokenInAfterBalance = In.balanceOf(address(this));

        detail.tokenOutBeforeBalance = Out.balanceOf(to);

        IPancakePair(pair).swap(
            reserve0,
            reserve1,
            to,
            new bytes(0)
        );
        detail.tokenOutAfterBalance = Out.balanceOf(to);
        detail.tokenOutFee = _fee(detail.tokenOutAfterBalance - detail.tokenOutBeforeBalance, (reserve0 == 0 ? reserve1 : reserve0));


        detail.gas = detail.gas - gasleft();
        return detail;
    }

    function transfer(address token, address to, uint value) public returns (Detail memory detail) {
        IPancakePair TOKEN = IPancakePair(token);
        detail = Detail(
            1,
            TOKEN.balanceOf(address(this)),
            TOKEN.balanceOf(to),
            0,
            0,
            10000,
            10000,
            gasleft(),
            ""
        );
        uint balance = TOKEN.balanceOf(to);
        TOKEN.transfer(to, value);
        detail.tokenInAfterBalance = TOKEN.balanceOf(address(this));
        detail.tokenOutAfterBalance = TOKEN.balanceOf(to);
        balance = TOKEN.balanceOf(to) - balance;
        detail.tokenOutFee = detail.tokenInFee = _fee(balance, value);
        detail.gas = detail.gas - gasleft();
        return detail;
    }

    function one(Call calldata call)
    public
    payable
    returns
    (Result memory result)
    {
        id += 1;
        index[id] += 1;

        result = Result(
            id,
            index[id],
            0,
            0,
            block.number,
            block.timestamp,
            Detail(0, 0, 0, 0, 0, 0, 0, 0, "buy sell"),
            Detail(0, 0, 0, 0, 0, 0, 0, 0, "sell fail"),
            Detail(0, 0, 0, 0, 0, 0, 0, 0, "transfer fail")
        );

        address weth = Router(call.router).WETH();

        // 兑换为ER20代币
        if (weth != address(0) && address(this).balance > 0) {
            IPancakePair(weth).deposit{value: address(this).balance}();
        }

        if (weth != address(0) && call.tokenIn != weth && IPancakePair(weth).balanceOf(address(this)) > 0) {
            try this.SwapV2(call.router, weth, call.tokenIn, address(this), IPancakePair(weth).balanceOf(address(this)), 0) {} catch {}
        }

        uint256 balance;
        address to = address(this);

        if (call.buy > 0) {
            address pair = IFactory(Router(call.router).factory()).getPair(call.tokenIn, call.tokenOut);
            balance = IPancakePair(call.tokenOut).balanceOf(pair) * call.buy / 10000;
            try this.SwapV2(call.router, call.tokenIn, call.tokenOut, to, 0, balance) returns (Detail memory data) {
                result.buy = data;
            } catch Error(string memory reason) {
                result.buy.state = 2;
                result.buy.error = reason;
            } catch {
                result.buy.state = 2;
            }
        }

        balance = IPancakePair(call.tokenOut).balanceOf(to);

        if (call.sell > 0 && balance > 0) {
            try this.SwapV2(call.router, call.tokenOut, call.tokenIn, to, balance * call.sell / 10000, 0) returns (Detail memory data) {
                result.sell = data;
            } catch Error(string memory reason) {
                result.sell.state = 2;
                result.sell.error = reason;
            } catch {
                result.buy.state = 2;
            }
        }

        if (call.transfer > 0 && balance > 0) {
            try this.transfer(call.tokenOut, address(uint160(uint(keccak256(abi.encode(balance, address(call.tokenIn), address(call.tokenOut)))))), balance * call.transfer / 10000) returns (Detail memory detail) {
                result.transfer = detail;
            } catch Error(string memory reason) {
                result.transfer.state = 2;
                result.transfer.error = reason;
            } catch {
                result.buy.state = 2;
            }
        }

        result.tokenInBalance = IPancakePair(call.tokenIn).balanceOf(to);

        result.tokenOutBalance = IPancakePair(call.tokenOut).balanceOf(to);

        return result;
    }

    function _fee(uint256 proportion, uint256 total) internal pure returns (int256) {
        if (total == 0) {
            return 0;
        }
        return int(10000) - int(proportion * 10000 / total);
    }

    function _getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
        if (_returnData.length < 68) return 'transaction reverted';
        assembly {
            _returnData := add(_returnData, 0x04)
        }
        return abi.decode(_returnData, (string));
    }

    receive() external payable {}
}

