import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as tracer from 'hardhat-tracer';

// necessary to activate it, apparently
console.log({tracer})

const config: HardhatUserConfig = {
  solidity: {
	  version: "0.4.21"
  },
  networks: {
	  ropsten: {
		  // probably the website's access token
          url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
          // pwd in Frame: abcd1abcd_abcd  
          accounts: [                      
              '0x5094676764308209890257048940985430985029590328529038509677694058']
      }                                    
  }                                        
};                                         
                                        
export default config;                  
                                           
                                           
                                           
                                           
                                           
                                           
                                           
                                        
