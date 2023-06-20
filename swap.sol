// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IRouter {
    function factory() external pure returns (address);

    function WETH() external pure returns (address);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

interface IPair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function mint(address to) external returns (uint liquidity);

    function totalSupply() external view returns (uint);
}

interface BEP20 {
    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(address from, address to, uint value) external returns (bool);
}

interface IWETH {

    function balanceOf(address owner) external view returns (uint);

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

contract TestSwapV2 {
    address ZERO_ADDRESS = address(0);
    address RANDOM_ADDRESS = address(1);


    address internal _this;

    struct LiquidityCall {
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
        address formAddress;
        uint256 formBeforeBalance;
        uint256 formAfterBalance;

        address recipientAddress;
        uint256 recipientBeforeBalance;
        uint256 recipientAfterBalance;

        uint256 transferAmount;
        uint256 recipientAmount;
        uint256 tradeAmount;
        uint256 reserveAmount;

        uint gas;
        int fee;
        bool isAddPair;
        bool isSwap;
        bool isBurn;
    }

    struct TradeInfo {
        uint256 state;
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
    }

    uint256 internal lastNumber = 0;
    uint256 internal id = 0;
    uint256 internal index = 0;

    modifier updateTransactionNo() {
        if (block.number > lastNumber) {
            lastNumber = block.number;
            index = 0;
            id += 1;
        }
        index += 1;
        _;
    }

    IRouter internal router;
    IWETH internal weth;
    IFactory internal factory;
    IPair internal pair;

    address _pair;
    address internal token0;
    uint256 reserve0;
    uint256 reserve1;
    uint256 totalSupply;

    modifier checkSwap(TradeCall memory call) {
        _beforeSwap(call.router, call.tokenIn, call.tokenOut, false);
        // 判断出资账户
        if (call.recipient == RANDOM_ADDRESS) {
            call.recipient = _killAddress(call.tokenIn, call.tokenOut);
        }
        _;
        _afterSwap();
    }

    modifier checkLiquidity(LiquidityCall calldata call) {
        _beforeSwap(call.router, call.tokenIn, call.tokenOut, false);
        _;
        _afterSwap();
    }


    constructor() payable {
        _this = address(this);
    }

    receive() external payable {}

    function
    swap(address tokenIn, address tokenOut, address from, address recipient, uint256 amountIn, uint256 amountOut)
    public
    returns (TradeInfo memory info)
    {
        require(amountIn != 0 || amountOut != 0, "TestSwap:amountIn and amountOut can't both be 0");

        info.state = 1;
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        amountIn = amountIn > 0 ? amountIn : router.getAmountsIn(amountOut, path)[0];

        info.tokenIn = _transfer(BEP20(tokenIn), from, address(pair), amountIn);


        if (token0 == tokenIn) {
            reserve1 = router.getAmountsOut(info.tokenIn.recipientAmount, path)[1];
            reserve0 = 0;
        } else {
            reserve0 = router.getAmountsOut(info.tokenIn.recipientAmount, path)[1];
            reserve1 = 0;
        }

        info.tokenOut = _swap(reserve0, reserve1, recipient);

        info.gas = info.tokenIn.gas + info.tokenOut.gas;

        return info;
    }

    function _swap(uint256 _reserve0, uint256 _reserve1, address to)
    internal
    returns (TokenInfo memory info)
    {
        BEP20 base = BEP20(_reserve0 == 0 ? pair.token1() : token0);
        info.transferAmount = _reserve0 == 0 ? _reserve1 : _reserve0;
        info.formAddress = _pair;
        info.formBeforeBalance = base.balanceOf(info.formAddress);

        info.recipientAddress = to;
        info.recipientBeforeBalance = base.balanceOf(to);

        info.gas = gasleft();
        pair.swap(reserve0, reserve1, to, new bytes(0));
        info.gas -= gasleft();


        info.formAfterBalance = base.balanceOf(info.formAddress);
        info.recipientAfterBalance = base.balanceOf(to);

    unchecked {
        info.recipientAmount = info.recipientAfterBalance - info.recipientBeforeBalance;
        info.tradeAmount = info.formBeforeBalance - info.formAfterBalance;
        info.reserveAmount = info.transferAmount - info.tradeAmount;
        info.fee = _fee(info.recipientAmount, info.transferAmount);
    }

        return info;
    }

    function addLiquidityV2(LiquidityCall calldata call)
    public
    payable
    checkLiquidity(call)
    returns
    (address, uint)
    {
        _transfer(BEP20(call.tokenIn), address(this), _pair, call.amountIn);
        _transfer(BEP20(call.tokenOut), tx.origin, _pair, call.amountOut);
        uint256 _liquidity = pair.mint(address(this));
        return (_pair, _liquidity);
    }

    function one(TradeCall memory call)
    public
    payable
    updateTransactionNo
    checkSwap(call)
    returns
    (TradeResult memory result)
    {
        // 设置交易号
        result.id = id;
        result.index = index;
        BEP20 OUT = BEP20(call.tokenOut);

        uint256 balance;
        address recipient = call.recipient;
        address sender = tx.origin;

        if (call.buy > 0) {
            balance = OUT.balanceOf(_pair) * call.buy / 10000;

            try this.swap(call.tokenIn, call.tokenOut, sender, recipient, 0, balance) returns (TradeInfo memory data) {
                result.buy = data;
            } catch Error(string memory reason) {
                result.buy.state = 2;
                result.buy.error = reason;
            } catch {
                result.buy.state = 2;
            }

        }

        sender = call.buy == 0 ? tx.origin : recipient;

        if (result.buy.state != 2 && call.sell > 0) {
            balance = OUT.balanceOf(sender);
            try this.swap(call.tokenOut, call.tokenIn, sender, recipient, balance * call.sell / 10000, 0) returns (TradeInfo memory data) {
                result.sell = data;
            } catch Error(string memory reason) {
                result.sell.state = 2;
                result.sell.error = reason;
            } catch {
                result.buy.state = 2;
            }
        }

        if (result.buy.state != 2 && call.transfer > 0) {
            balance = OUT.balanceOf(sender);
            try this.transfer(call.tokenOut, sender, _randomAddress(), balance * call.transfer / 10000) returns (TradeInfo memory info) {
                result.transfer = info;
            } catch Error(string memory reason) {
                result.transfer.state = 2;
                result.transfer.error = reason;
            } catch {
                result.buy.state = 2;
            }
        }

        result.account = Account(recipient, BEP20(call.tokenIn).balanceOf(call.recipient), OUT.balanceOf(call.recipient));

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
        info.state = 1;
        info.tokenIn = info.tokenOut = _transfer(BEP20(token), from, to, value);
        info.gas = info.tokenIn.gas;
        return info;
    }

    function _transferFromAddress(BEP20 token, address from, uint value)
    internal
    returns (address)
    {
        if (from == _this) {
            return _this;
        } else if (token.allowance(from, _this) >= value && token.balanceOf(from) >= value) {
            return from;
        } else if (from != tx.origin && token.allowance(tx.origin, _this) >= value && token.balanceOf(tx.origin) >= value) {
            return tx.origin;
        } else {
            return _this;
        }
    }

    // 转移代币信息
    function _transfer(BEP20 token, address from, address to, uint value)
    internal
    returns (TokenInfo memory info)
    {
        info.transferAmount = value;
        info.formAddress = _transferFromAddress(token, from,value);
        info.formBeforeBalance = token.balanceOf(info.formAddress);

        info.recipientAddress = to;
        info.recipientBeforeBalance = token.balanceOf(to);

        if (address(pair) != ZERO_ADDRESS) {
            (reserve0, reserve1,) = pair.getReserves();
            totalSupply = pair.totalSupply();
        }

        // 转账
        info.gas = gasleft();

        if (info.formAddress == _this) {
            require(token.transfer(to, value), "TestSwap:transfer fail");
        } else {
            require(token.transferFrom(from, to, value), "TestSwap:transferFrom fail");
        }

        info.gas -= gasleft();

        // 接受者的现在余额
        info.formAfterBalance = token.balanceOf(info.formAddress);
        info.recipientAfterBalance = token.balanceOf(to);

        // 防止给池子时池子燃烧溢出
    unchecked {
        info.recipientAmount = info.recipientAfterBalance - info.recipientBeforeBalance;
    }

        if (address(pair) != ZERO_ADDRESS) {
            info.isAddPair = pair.totalSupply() > totalSupply;
            (uint256 r0, uint256 r1,) = pair.getReserves();

            uint256 rThis;
            if (token0 == address(token)) {
                rThis = r0;
                info.isSwap = r1 < reserve1;
                info.isBurn = r0 < reserve0;
            } else {
                rThis = r1;
                info.isSwap = r0 < reserve0;
                info.isBurn = r1 < reserve1;
            }
            // 重设账户余额
            if (to == address(pair)) {
                info.recipientAmount = info.recipientAfterBalance - rThis;
            }
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
    function _killAddress(address base, address other)
    internal
    returns (address)
    {
        Kill kill = new Kill(base, other);
        kill.kill();
        return address(kill);
    }

    function _beforeSwap(address _router, address _base, address _other, bool isCreatePair)
    internal
    {
        router = IRouter(_router);
        weth = IWETH(router.WETH());
        factory = IFactory(router.factory());

        if (_this.balance > 5 ether) {
            weth.deposit {value : _this.balance - 5 ether}();
        }

        if (_base != address(weth) && weth.balanceOf(_this) > 0) {
            _pair = factory.getPair(_base, _other);

            pair = IPair(_pair);
            token0 = pair.token0();
            try this.swap(address(weth), _base, address(this),address(this), weth.balanceOf(_this), 0) {} catch {}
        }

        _pair = factory.getPair(_base, _other);

        require(_pair != ZERO_ADDRESS || isCreatePair, "TestSwap:pools of base token and ETH do not exist");

        if (_pair == ZERO_ADDRESS) {
            _pair = factory.createPair(_base, _other);
        }

        pair = IPair(_pair);
        token0 = pair.token0();
    }

    function _afterSwap()
    internal
    {
        delete router;
        delete weth;
        delete factory;
        delete pair;
        delete token0;

        delete reserve0;
        delete reserve1;
        delete totalSupply;
        delete _pair;
    }
}