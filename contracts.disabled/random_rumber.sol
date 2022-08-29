pragma solidity ^0.8.16;

contract GuessTheRandomNumberChallenge {
    uint8 answer;

    constructor() public payable {
        require(msg.value == 1 ether);
        answer = 1;
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function guess(uint8 n) public payable {
        require(msg.value == 1 ether);

        if (n == answer) {
            payable(msg.sender).transfer(2 ether);
        }
    }
}
