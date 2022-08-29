pragma solidity ^0.8.16;


import "hardhat/console.sol";

contract TokenSaleChallenge {
    mapping(address => uint256) public balanceOf;
    uint256 constant PRICE_PER_TOKEN = 1 ether;

    constructor(address _player) public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance < 1 ether;
    }

    function buy(uint256 numTokens) public payable {
		unchecked {
			console.log("numTokens %s\n msg.value %s\n multiple %s",
						numTokens,
						msg.value,
						numTokens * PRICE_PER_TOKEN);
			console.log(" price per token %s",
					   PRICE_PER_TOKEN);

			require(msg.value == numTokens * PRICE_PER_TOKEN, "pay up");

			balanceOf[msg.sender] += numTokens;
		}
    }

    function sell(uint256 numTokens) public {
		unchecked {
			require(balanceOf[msg.sender] >= numTokens);

			balanceOf[msg.sender] -= numTokens;
			payable(msg.sender).transfer(numTokens * PRICE_PER_TOKEN);
		}
    }
}
