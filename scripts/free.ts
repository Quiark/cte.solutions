// not using hardhat
import * as ethers from 'ethers'
import { BN } from 'bn.js'

const eut = ethers.utils
const BigNumber = ethers.BigNumber

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

async function accountTakeover() {
	function toBN(value: any) {
		const hex = BigNumber.from(value).toHexString();
		if (hex[0] === "-") {
			return (new BN("-" + hex.substring(3), 16));
		}
		return new BN(hex.substring(2), 16);
	}
	let owner = '0x6B477781b0e68031109f21887e6B5afEAaEB002b'
	let txs = [
		'0xd79fc80e7b787802602f3317b7fe67765c14a7d40c3e0dcb266e63657f881396',
		'0x061bf0b4b5fdb64ac475795e9bc5a3978f985919ce6747ce2cfbbcaccaf51009',
	]
	let rawtxs = [
		'0xf86b80843b9aca008252089492b28647ae1f3264661f72fb2eb9625a89d88a31881111d67bb1bb00008029a069a726edfb4b802cbf267d5fd1dabcea39d3d7b4bf62b9eeaeba387606167166a07724cedeb923f374bef4e05c97426a918123cc4fec7b07903839f12517e1b3c8',
		'0xf86b01843b9aca008252089492b28647ae1f3264661f72fb2eb9625a89d88a31881922e95bca330e008029a069a726edfb4b802cbf267d5fd1dabcea39d3d7b4bf62b9eeaeba387606167166a02bbd9c2a6285c2b43e728b17bda36a81653dd5f4612a2e0aefdb48043c5108de'
	]

	let objs = [{
		hash: '0xd79fc80e7b787802602f3317b7fe67765c14a7d40c3e0dcb266e63657f881396',
		type: 0,
		accessList: null,
		blockHash: '0x0515b2216fa8012618c330bff363d7a49876f4b0f05752b17b01597b5527a604',
		blockNumber: 3015063,
		transactionIndex: 9,
		confirmations: 9890728,
		from: '0x6B477781b0e68031109f21887e6B5afEAaEB002b',
		to: '0x92b28647Ae1F3264661f72fb2eB9625A89D88A31',
		nonce: 0,
		data: '0x',
		r: '0x69a726edfb4b802cbf267d5fd1dabcea39d3d7b4bf62b9eeaeba387606167166',
		s: '0x7724cedeb923f374bef4e05c97426a918123cc4fec7b07903839f12517e1b3c8',
		v: 41,
		creates: null,
		chainId: 3,
		gasPrice: BigNumber.from( "1000000000" ),
		gasLimit: BigNumber.from("21000"),
		value: BigNumber.from ( "1230000000000000000" ),
	},
	{
		hash: '0x061bf0b4b5fdb64ac475795e9bc5a3978f985919ce6747ce2cfbbcaccaf51009',
		type: 0,
		accessList: null,
		blockHash: '0xe23306ce25e2e0329ed148f17e16b3b566b2b42cb86bf4ece5b41a0fee30a497',
		blockNumber: 3015068,
		transactionIndex: 17,
		confirmations: 9890723,
		from: '0x6B477781b0e68031109f21887e6B5afEAaEB002b',
		to: '0x92b28647Ae1F3264661f72fb2eB9625A89D88A31',
		nonce: 1,
		data: '0x',
		r: '0x69a726edfb4b802cbf267d5fd1dabcea39d3d7b4bf62b9eeaeba387606167166',
		s: '0x2bbd9c2a6285c2b43e728b17bda36a81653dd5f4612a2e0aefdb48043c5108de',
		v: 41,
		creates: null,
		chainId: 3,
		gasPrice: BigNumber.from (  "1000000000" ),
		gasLimit: BigNumber.from (  "21000" ),
		value: BigNumber.from (  "1811266580600000000" ),
	} ]
	let L1 = BigNumber.from(getTxDigest(objs[0]))
	let L2 = BigNumber.from(getTxDigest(objs[1]))

	let s1 = BigNumber.from(objs[0].s)
	let s2 = BigNumber.from(objs[1].s)
	let r1 = BigNumber.from(objs[0].r)
	let publicKeyOrderInteger = BigNumber.from('115792089237316195423570985008687907852837564279074904382605163141518161494337')
	//let publicKeyOrderInteger = BigNumber.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F')
	// ((s2 * L1) % publicKeyOrderInteger) - ((s1 * L2) % publicKeyOrderInteger)
	let numerator = (s2.mul(L1).mod(publicKeyOrderInteger)).sub(s1.mul(L2).mod(publicKeyOrderInteger))
	// denominator = inverse_mod(r1 * ((s1 - s2) % publicKeyOrderInteger), publicKeyOrderInteger)
	let denominator = toBN(r1.mul(s1.sub(s2).mod(publicKeyOrderInteger))).invm(toBN(publicKeyOrderInteger))
	//console.log(denominator.toString('hex'))

	let privateKey = numerator.mul(BigNumber.from('0x' + denominator.toString('hex'))).mod(publicKeyOrderInteger)
	let wallet = new ethers.Wallet(privateKey.toHexString())
	//let addr = ethers.utils.recoverAddress(L2.toHexString(), objs[1])
	/*
	console.log({L2, addr})
	console.log(wallet._signingKey().signDigest(L2.toHexString()))
	*/
	console.log(wallet.address, owner)
	console.log(privateKey.toHexString())
}

accountTakeover().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
