pragma solidity ^0.8.10;

contract RetirementFundChallenge {
    uint256 startBalance;
    address owner = msg.sender;
    address beneficiary;
    uint256 expiration = block.timestamp + 0x100000000;
	bool inited = false;

    constructor() payable {
        //require(msg.value == 1 ether);

        beneficiary = 0x1B306B5B16c989Fb5A1F5D8c260d912C5c14593f;
        startBalance = msg.value;
    }

	function init() public payable {
		require(msg.value == 1 ether);
        require(!inited);                                 
                                                          
        inited = true;                                    
    }                                                     
                                                          
    function isComplete() public view returns (bool) {    
        return ((address(this).balance == 0) && inited);  
    }                                                  
                                                       
    function crytic_is_complete() view public returns (bool) {
        return ! isComplete();                         
    }                                                  
                                                       
    function withdraw() public {
		unchecked {
			require(msg.sender == owner);             
													  
			if (block.timestamp < expiration) {       
				// early withdrawal incurs a 10% penalty
				payable(msg.sender).transfer(address(this).balance * 9 / 10);
			} else {                                  
				payable(msg.sender).transfer(address(this).balance);
			}
		}
    }

    function collectPenalty() public {
		unchecked {
			//require(msg.sender == beneficiary);

			uint256 withdrawn = startBalance - address(this).balance;

			// an early withdrawal occurred
			//require(withdrawn > 0);

			// penalty is what's left
			payable(msg.sender).transfer(address(this).balance);
		}
    }
}
