pragma solidity ^0.8.10;

interface IFuzzyIdentityChallenge {
	function authenticate() external;
}

contract PersonalWallet {

	function name() external pure returns (bytes32) {
		return bytes32("smarx");
	}

	function auth(IFuzzyIdentityChallenge to) external {
		to.authenticate{ gas: 20000 }();
	}
}
