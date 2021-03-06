/* eslint-env mocha */
'use strict'

const loadFixture = require('aegir/fixtures')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const IpldBitcoin = require('../src/index')
const helpers = require('./helpers')

const fixtureBlockHex = loadFixture('test/fixtures/block.hex')
const fixtureBlockHeader = helpers.headerFromHexBlock(fixtureBlockHex)
const invalidDagNode = {invalid: 'dagNode'}

describe('IPLD format util API deserialize()', () => {
  it('should work correctly', (done) => {
    IpldBitcoin.util.deserialize(fixtureBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyBlock(dagNode, {
        version: 2,
        prevHash: '87d6242b27d248a9e145fe764a0bcef03a403883a2e4c8590200000000000000',
        merkleRoot: '11a5b9a70acebedbbf71ef8ca341e8a98cf279c49eee8f92e10a2227743b6aeb',
        timestamp: 1386981279,
        bits: 419740270,
        nonce: 3159344128
      })
      done()
    })
  })

  it('should deserialize Segwit correctly (a)', (done) => {
    const segwitBlockHex = loadFixture('test/fixtures/segwit.hex')
    const segwitBlockHeader = helpers.headerFromHexBlock(segwitBlockHex)
    IpldBitcoin.util.deserialize(segwitBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyBlock(dagNode, {
        version: 536870914,
        prevHash: '1b7c39197e95b49b38ff96c7bf9e1db4a9f36b5698ecd6000000000000000000',
        merkleRoot: 'c3f2244dfb3c833c62e72e05b7fd1bd6bcba2d6cd455984a1059db7a4bf38348',
        timestamp: 1503722576,
        bits: 402734313,
        nonce: 3781004001
      })
      verifyCid(
        dagNode,
        '562099014a2fd1503c30f92f8a8306ec4d5409d547ce21d906000000000000000000',
        done)
    })
  })

  it('should deserialize Segwit correctly (b)', (done) => {
    const segwitBlockHex = loadFixture('test/fixtures/segwit2.hex')
    const segwitBlockHeader = helpers.headerFromHexBlock(segwitBlockHex)
    IpldBitcoin.util.deserialize(segwitBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyBlock(dagNode, {
        version: 536870914,
        prevHash: '92f0d678374dbb0a205345d38f35be782412207bbdaa71000000000000000000',
        merkleRoot: '99e3557bb520c3d45d6eb6ee18f93b3665bf4c8d9747200db4292fdbacc278c3',
        timestamp: 1503851731,
        bits: 402734313,
        nonce: 3911763601
      })
      verifyCid(
        dagNode,
        '562090bd49e9fae063aa4db26ae434212157c4c72e16492aac000000000000000000',
        done)
    })
  })

  it('should deserialize Segwit correctly (c)', (done) => {
    const segwitBlockHex = loadFixture('test/fixtures/segwit3.hex')
    const segwitBlockHeader = helpers.headerFromHexBlock(segwitBlockHex)
    IpldBitcoin.util.deserialize(segwitBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyBlock(dagNode, {
        version: 536870912,
        prevHash: '92fed79ebe58e1604dc08037488567c0881e1ae6a67831010000000000000000',
        merkleRoot: '654f3617284e0c0f71baeaea9f54e337645550832b63de3dce4b66b2fbb27309',
        timestamp: 1503848099,
        bits: 402734313,
        nonce: 2945767029
      })
      verifyCid(
        dagNode,
        '56205bd62fe2f3fe376ff2645681bebe7d12b64d9446ef72d1000000000000000000',
        done)
    })
  })

  it('should error on an invalid block', (done) => {
    const invalidBlock = Buffer.from('abcdef', 'hex')
    IpldBitcoin.util.deserialize(invalidBlock, (err, dagNode) => {
      expect(dagNode).to.not.exist()
      expect(err).to.be.an('error')
      done()
    })
  })
})

describe('IPLD format util API serialize()', () => {
  it('should round-trip (de)serialization correctly', (done) => {
    IpldBitcoin.util.deserialize(fixtureBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      IpldBitcoin.util.serialize(dagNode, (err, binaryBlob) => {
        expect(err).to.not.exist()
        expect(binaryBlob).to.deep.equal(fixtureBlockHeader)
        done()
      })
    })
  })

  it('should error on an invalid internal representation', (done) => {
    IpldBitcoin.util.serialize(invalidDagNode, (err, binaryBlob) => {
      expect(binaryBlob).to.not.exist()
      expect(err).to.be.an('error')
      done()
    })
  })
})

describe('IPLD format util API cid()', () => {
  it('should encode the CID correctly', (done) => {
    IpldBitcoin.util.deserialize(fixtureBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyCid(
        dagNode,
        '56203ec2c691d447b2fd0d6a94742345af1f351037dab1ab9e900200000000000000',
        done)
    })
  })

  it('should error on an invalid internal representation', (done) => {
    IpldBitcoin.util.cid(invalidDagNode, (err, cid) => {
      expect(cid).to.not.exist()
      expect(err).to.be.an('error')
      done()
    })
  })

  it('should encode the CID correctly with options', (done) => {
    IpldBitcoin.util.deserialize(fixtureBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyCid1(
        dagNode,
        { hashAlg: 'sha3-256' },
        '16208fd2802e0304c79c08a1ff2afb706ce64b78f3b94fd1c9142946c2e715589cfb',
        done)
    })
  })

  it('should encode the CID correctly with undefined options', (done) => {
    IpldBitcoin.util.deserialize(fixtureBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyCid1(
        dagNode,
        undefined,
        '56203ec2c691d447b2fd0d6a94742345af1f351037dab1ab9e900200000000000000',
        done)
    })
  })

  it('should encode the CID correctly with default options specified', (done) => {
    IpldBitcoin.util.deserialize(fixtureBlockHeader, (err, dagNode) => {
      expect(err).to.not.exist()
      verifyCid1(
        dagNode,
        { version: 1, hashAlg: 'dbl-sha2-256' },
        '56203ec2c691d447b2fd0d6a94742345af1f351037dab1ab9e900200000000000000',
        done)
    })
  })
})

const verifyBlock = (dagNode, expected) => {
  expect(dagNode.version).to.equal(expected.version)
  expect(dagNode.prevHash.toString('hex')).to.equal(expected.prevHash)
  expect(dagNode.merkleRoot.toString('hex')).to.equal(expected.merkleRoot)
  expect(dagNode.timestamp).to.equal(expected.timestamp)
  expect(dagNode.bits).to.equal(expected.bits)
  expect(dagNode.nonce).to.equal(expected.nonce)
}

const verifyCid = (dagNode, expectedCid, doneCb) => {
  IpldBitcoin.util.cid(dagNode, (err, cid) => {
    expect(err).to.not.exist()
    expect(cid.multihash.toString('hex')).to.equal(expectedCid)
    doneCb()
  })
}

const verifyCid1 = (dagNode, options, expectedCid, doneCb) => {
  IpldBitcoin.util.cid(dagNode, options, (err, cid) => {
    expect(err).to.not.exist()
    expect(cid.multihash.toString('hex')).to.equal(expectedCid)
    doneCb()
  })
}
