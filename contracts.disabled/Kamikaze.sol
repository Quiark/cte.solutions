pragma solidity ^0.8.16;

contract Kamikaze {
	constructor() payable { }

	function bye(address payable target) external {
		selfdestruct(target);
	}
}
