pragma solidity ^0.4.21;

//import "hardhat/console.sol";

contract Measure {
	struct Contribution {
        uint256 amount;
        uint256 unlockTimestamp;
    }

	Contribution[] queue ;

	function Measure() public {
		queue.push(Contribution(0x123, 0x456));
	}
	 

	function show() external {
		uint256 unlock = block.timestamp + 50 * 365 days;
		//console.log("unlock %s now %s", unlock, block.timestamp);
	}

	function save(uint256 ix) external {
		if (false) {
			Contribution storage contr = queue[ix];

		} else {
			contr.amount = 0x11aa22;
			contr.unlockTimestamp = queue.length;
			queue.push(contr);
		}
	}

	function put(uint256 ix,  uint256 val) public {
		queue[ix].amount = val;
	}

	function getQueue(uint256 index) view returns (uint256, uint256) {
		return (queue[index].amount, queue[index].unlockTimestamp);

	}
}
