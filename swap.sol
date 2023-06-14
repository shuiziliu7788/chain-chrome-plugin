// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface Router {
    function factory() external pure returns (address);

    function WETH() external pure returns (address);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

interface BEP20 {
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

    function mint(address to) external returns (uint liquidity);

    function deposit() external payable;

    function withdraw(uint) external;
}

interface IFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract Kill {
    constructor(address token0, address token1)  {
        BEP20(token0).approve(msg.sender, type(uint256).max);
        BEP20(token1).approve(msg.sender, type(uint256).max);
    }

    function kill() public {
        selfdestruct(payable(msg.sender));
    }
}

contract TestSwap {
    uint256 internal id = 0;
    uint256 internal lastNumber = 0;
    uint256 internal index = 0;
    address[] internal accounts;
    address internal _this;

    enum State {
        DEFAULT,
        SUCCESS,
        FAIL
    }

    struct LiquifyCall {
        address router;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
    }

    struct TradeCall {
        address router;
        address tokenIn;
        address tokenOut;
        address recipient;
        uint256 buy;
        uint256 sell;
        uint256 transfer;
    }

    struct TokenInfo {
        uint256 formBeforeBalance;
        uint256 formAfterBalance;
        uint256 recipientBeforeBalance;
        uint256 recipientAfterBalance;
        uint256 transferAmount;
        uint256 tradeAmount;
        uint256 recipientAmount;
        uint256 reserveAmount;
        uint gas;
        int fee;
        bool isAddPair;
        bool isSwap;
    }

    struct TradeInfo {
        State state;
        uint256 gas;
        TokenInfo tokenIn;
        TokenInfo tokenOut;
        string error;
    }

    struct Account {
        address account;
        uint256 balanceIn;
        uint256 balanceOut;
    }

    struct TradeResult {
        uint id;
        uint index;
        TradeInfo buy;
        TradeInfo sell;
        TradeInfo transfer;
        Account account;
        uint256 blockNumber;
        uint256 blockTimestamp;
    }

    modifier theSwap() {
        if (block.number > lastNumber) {
            lastNumber = block.number;
            index = 0;
            id += 1;
        }
        index += 1;
        _;
    }

    modifier automated(address router, address token) {
        if (address(this).balance > 0) {
            BEP20 WETH = BEP20(Router(router).WETH());
            WETH.deposit{value: _this.balance}();
            if (token != address(WETH) && WETH.balanceOf(_this) > 0) {
                try this.swapV2(router, address(WETH), token, address(this), address(this), WETH.balanceOf(_this), 0) {} catch {}
            }
        }
        _;
    }

    constructor() payable {
        _this = address(this);
    }

    function
    swapV2(address router, address tokenIn, address tokenOut, address from, address recipient, uint256 amountIn, uint256 amountOut)
    public
    returns (TradeInfo memory info)
    {
        info.state = State.SUCCESS;
        info.gas = gasleft();
        address pair = IFactory(Router(router).factory()).getPair(tokenIn, tokenOut);
        require(pair != address(0), "pool does not exist");

        BEP20 PAIR = BEP20(pair);
        BEP20 IN = BEP20(tokenIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        if (amountIn == 0 && amountOut != 0) {
            amountIn = Router(router).getAmountsIn(amountOut, path)[0];
        }

        require(amountIn > 0, "tokenIn not be zero");

        if (amountIn > IN.balanceOf(pair) * 9999 / 10000) {
            amountIn = IN.balanceOf(pair) * 9999 / 10000;
        }

        // 转移IN代币
        info.tokenIn = _transfer(tokenIn, from, pair, amountIn, true);
        uint256 reserve1;
        uint256 reserve0;

        if (PAIR.token0() == tokenIn) {
            reserve1 = Router(router).getAmountsOut(info.tokenIn.recipientAmount, path)[1];
            reserve0 = 0;
        } else {
            reserve0 = Router(router).getAmountsOut(info.tokenIn.recipientAmount, path)[1];
            reserve1 = 0;
        }

        info.tokenOut = _swap(pair, reserve0, reserve1, recipient);

        info.gas -= gasleft();
        return info;
    }

    function addLiquifyV2(LiquifyCall calldata call)
    public
    automated(call.router, call.tokenIn)
    payable
    returns
    (address pair, uint liquidity)
    {
        address factory = Router(call.router).factory();
        pair = IFactory(factory).getPair(call.tokenIn, call.tokenOut);

        if (pair == address(0)) {
            pair = IFactory(factory).createPair(call.tokenIn, call.tokenOut);
        }
        _transfer(call.tokenIn, address(this), pair, call.amountIn, false);
        _transfer(call.tokenOut, tx.origin, pair, call.amountOut, false);
        liquidity =  BEP20(pair).mint(address(this));
        return (pair,liquidity);
    }


    function one(TradeCall calldata call)
    public
    payable
    theSwap
    automated(call.router, call.tokenIn)
    returns
    (TradeResult memory result)
    {
        result.id = id;
        result.index = index;
        result.blockNumber = block.number;
        result.blockTimestamp = block.timestamp;
        address recipient = call.recipient == address(1) ? _killAddress(call.tokenIn, call.tokenOut) : call.recipient;
        BEP20 IN = BEP20(call.tokenIn);
        BEP20 OUT = BEP20(call.tokenOut);

        uint256 balance;

        if (call.buy > 0) {
            address pair = IFactory(Router(call.router).factory()).getPair(call.tokenIn, call.tokenOut);

            balance = OUT.balanceOf(pair) * call.buy / 10000;

            try this.swapV2(call.router, call.tokenIn, call.tokenOut, address(this), recipient, 0, balance) returns (TradeInfo memory data) {
                result.buy = data;
            } catch Error(string memory reason) {
                result.buy.state = State.FAIL;
                result.buy.error = reason;
            } catch {
                result.buy.state = State.FAIL;
            }
        }

        if (result.buy.state != State.FAIL && call.sell > 0) {
            balance = OUT.balanceOf(call.buy == 0 ? tx.origin : recipient);
            try this.swapV2(call.router, call.tokenOut, call.tokenIn, recipient, recipient, balance * call.sell / 10000, 0) returns (TradeInfo memory data) {
                result.sell = data;
            } catch Error(string memory reason) {
                result.sell.state = State.FAIL;
                result.sell.error = reason;
            } catch {
                result.buy.state = State.FAIL;
            }
        }

        if (result.buy.state != State.FAIL && call.transfer > 0) {
            balance = OUT.balanceOf(call.buy == 0 ? tx.origin : recipient);
            try this.transfer(call.tokenOut, recipient, _randomAddress(), balance * call.transfer / 10000) returns (TradeInfo memory info) {
                result.transfer = info;
            } catch Error(string memory reason) {
                result.transfer.state = State.FAIL;
                result.transfer.error = reason;
            } catch {
                result.buy.state = State.FAIL;
            }
        }

        result.account = Account(recipient, IN.balanceOf(recipient), OUT.balanceOf(recipient));

        return result;
    }

    function many(TradeCall[] calldata calls)
    public
    payable
    returns
    (TradeResult[] memory results)
    {
        results = new TradeResult[](calls.length);
        for (uint i = 0; i < calls.length; i++) {
            try this.one(calls[i]) returns (TradeResult memory result) {
                results[i] = result;
            } catch {

            }
        }
    }

    function transfer(address token, address from, address to, uint value)
    public
    returns (TradeInfo memory info)
    {
        info.state = State.SUCCESS;
        info.gas = gasleft();
        info.tokenIn = info.tokenOut = _transfer(token, from, to, value, false);
        info.gas -= gasleft();
        return info;
    }

    // 转移代币信息
    function _transfer(address token, address from, address to, uint value, bool isPair)
    internal
    returns (TokenInfo memory info)
    {
        BEP20 TOKEN = BEP20(token);
        BEP20 PAIR = BEP20(to);
        info.transferAmount = value;

        info.recipientBeforeBalance = TOKEN.balanceOf(to);
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;

        if (isPair) {
            (reserve0, reserve1,) = PAIR.getReserves();
            totalSupply = PAIR.totalSupply();
        }
        // 计算出资账号

        if (from == _this) {
            info.formBeforeBalance = TOKEN.balanceOf(address(this));
            info.gas = gasleft();
            require(TOKEN.transfer(to, value), "transfer fail");
            info.gas -= gasleft();
            info.formAfterBalance = TOKEN.balanceOf(address(this));
        } else if (TOKEN.allowance(from, _this) >= value && TOKEN.balanceOf(from) >= value) {
            info.formBeforeBalance = TOKEN.balanceOf(from);
            info.gas = gasleft();
            require(TOKEN.transferFrom(from, to, value), "transferFrom fail");
            info.gas -= gasleft();
            info.formAfterBalance = TOKEN.balanceOf(from);
        } else if (TOKEN.allowance(tx.origin, _this) >= value && TOKEN.balanceOf(tx.origin) >= value) {
            info.formBeforeBalance = TOKEN.balanceOf(tx.origin);
            info.gas = gasleft();
            require(TOKEN.transferFrom(tx.origin, to, value), "transferFrom fail");
            info.gas -= gasleft();
            info.formAfterBalance = TOKEN.balanceOf(tx.origin);
        } else {
            info.formBeforeBalance = TOKEN.balanceOf(address(this));
            info.gas = gasleft();
            require(TOKEN.transfer(to, value), "transfer fail");
            info.gas -= gasleft();
            info.formAfterBalance = TOKEN.balanceOf(address(this));
        }

        // 接受者的现在余额
        info.recipientAfterBalance = TOKEN.balanceOf(to);

        if (isPair) {
            (uint256 r0, uint256 r1,) = PAIR.getReserves();
            if (PAIR.token0() == token) {
                info.recipientAmount = info.recipientAfterBalance - r0;
                info.isSwap = r1 < reserve1;
            } else {
                info.recipientAmount = info.recipientAfterBalance - r1;
                info.isSwap = r0 < reserve0;
            }
            // 判断是否添加池子
            info.isAddPair = PAIR.totalSupply() > totalSupply;
        } else {
            info.recipientAmount = info.recipientAfterBalance - info.recipientBeforeBalance;
        }

        unchecked {
        // 实际支付的数量
            info.tradeAmount = info.formBeforeBalance - info.formAfterBalance;
        // 自动保留的数量
            info.reserveAmount = value - info.tradeAmount;
        // 手续费
            info.fee = _fee(info.recipientAmount, info.tradeAmount);
        }

        return info;
    }

    // 调用池子交易
    function _swap(address pair, uint256 reserve0, uint256 reserve1, address to)
    internal
    returns (TokenInfo memory info)
    {
        BEP20 PAIR = BEP20(pair);
        BEP20 TOKEN = BEP20(reserve0 == 0 ? PAIR.token1() : PAIR.token0());
        info.transferAmount = reserve0 == 0 ? reserve1 : reserve0;

        info.formBeforeBalance = TOKEN.balanceOf(pair);
        info.recipientBeforeBalance = TOKEN.balanceOf(to);
        info.gas = gasleft();
        PAIR.swap(
            reserve0,
            reserve1,
            to,
            new bytes(0)
        );
        info.gas -= gasleft();
        info.formAfterBalance = TOKEN.balanceOf(pair);
        info.recipientAfterBalance = TOKEN.balanceOf(to);

        unchecked {
            info.recipientAmount = info.recipientAfterBalance - info.recipientBeforeBalance;
            info.tradeAmount = info.formBeforeBalance - info.formAfterBalance;
            info.reserveAmount = info.transferAmount - info.tradeAmount;
            info.fee = _fee(info.recipientAmount, info.tradeAmount);
        }

        return info;
    }

    // 计算手续费
    function _fee(uint256 proportion, uint256 total)
    internal
    pure
    returns (int256)
    {
        if (total == 0) {
            return 0;
        }
        return int(10000) - int(proportion * 10000 / total);
    }

    // 创建随机地址
    function _randomAddress()
    internal
    view
    returns (address)
    {
        return address(uint160(uint(keccak256(abi.encode(id, index, block.number, block.timestamp)))));
    }

    // 创建直接销毁
    function _killAddress(address token0, address token1)
    internal
    returns (address)
    {
        Kill kill = new Kill(token0, token1);
        kill.kill();
        accounts.push(address(kill));
        return address(kill);
    }

    receive() external payable {}
}