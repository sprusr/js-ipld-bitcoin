/* eslint-env mocha */
'use strict'

const loadFixture = require('aegir/fixtures')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const CID = require('cids')
const IpldBitcoin = require('../src/index')
const helpers = require('./helpers')

const fixtureBlockHex = loadFixture('test/fixtures/block.hex')
const fixtureBlockHeader = helpers.headerFromHexBlock(fixtureBlockHex)
const invalidBlock = Buffer.from('abcdef', 'hex')

describe('IPLD format resolve API resolve()', () => {
  it('should return the deserialized node if no path is given', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlockHeader, (err, value) => {
      expect(err).to.not.exist()
      expect(value.remainderPath).is.empty()
      expect(value.value).is.not.empty()
      done()
    })
  })

  it('should return the deserialized node if path is empty', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlockHeader, '', (err, value) => {
      expect(err).to.not.exist()
      expect(value.remainderPath).is.empty()
      expect(value.value).is.not.empty()
      done()
    })
  })

  it('should return the version', (done) => {
    verifyPath(fixtureBlockHeader, 'version', 2, done)
  })

  it('should return the timestamp', (done) => {
    verifyPath(fixtureBlockHeader, 'timestamp', 1386981279, done)
  })

  it('should return the difficulty', (done) => {
    verifyPath(fixtureBlockHeader, 'difficulty', 419740270, done)
  })

  it('should return the nonce', (done) => {
    verifyPath(fixtureBlockHeader, 'nonce', 3159344128, done)
  })

  it('should error on non-existent path', (done) => {
    verifyError(fixtureBlockHeader, 'something/random', done)
  })

  it('should error on path starting with a slash', (done) => {
    verifyError(fixtureBlockHeader, '/version', done)
  })

  it('should error on partially matching path that isn\'t a link', (done) => {
    verifyError(fixtureBlockHeader, 'version/but/additional/things', done)
  })

  it('should return a link when parent is requested', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlockHeader, 'parent', (err, value) => {
      expect(err).to.not.exist()
      expect(value.remainderPath).is.empty()
      expect(value.value).to.deep.equal({
        '/': new CID('z4HFzdHLxSgJvCMJrsDtV7MgqiGALZdbbxgcTLVUUXQGBkGYjLb')})
      done()
    })
  })

  it('should return a link and remaining path when parent is requested',
    (done) => {
      IpldBitcoin.resolver.resolve(fixtureBlockHeader, 'parent/timestamp',
        (err, value) => {
          expect(err).to.not.exist()
          expect(value.remainderPath).to.equal('timestamp')
          expect(value.value).to.deep.equal({
            '/':
              new CID('z4HFzdHLxSgJvCMJrsDtV7MgqiGALZdbbxgcTLVUUXQGBkGYjLb')})
          done()
        })
    })

  it('should return a link when transactions are requested', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlockHeader, 'tx/some/remainder',
      (err, value) => {
        expect(err).to.not.exist()
        expect(value.remainderPath).to.equal('some/remainder')
        expect(value.value).to.deep.equal({
          '/': new CID('z4HFzdHD15kVvtmVzeD7z9sisZ7acSC88wXS3KJGwGrnr2DwcVQ')})
        done()
      })
  })

  it('should return an error if block is invalid', (done) => {
    verifyError(invalidBlock, 'version', done)
  })
})

describe('IPLD format resolver API tree()', () => {
  it('should return only paths by default', (done) => {
    IpldBitcoin.resolver.tree(fixtureBlockHeader, (err, value) => {
      expect(err).to.not.exist()
      expect(value).to.deep.equal(['version', 'timestamp', 'difficulty',
        'nonce', 'parent', 'tx'])
      done()
    })
  })

  it('should be able to return paths and values', (done) => {
    IpldBitcoin.resolver.tree(fixtureBlockHeader, {values: true}, (err, value) => {
      expect(err).to.not.exist()
      expect(value).to.deep.equal({
        version: 2,
        timestamp: 1386981279,
        difficulty: 419740270,
        nonce: 3159344128,
        parent: {
          '/': new CID('z4HFzdHLxSgJvCMJrsDtV7MgqiGALZdbbxgcTLVUUXQGBkGYjLb')},
        tx: {
          '/': new CID('z4HFzdHD15kVvtmVzeD7z9sisZ7acSC88wXS3KJGwGrnr2DwcVQ')}})
      done()
    })
  })

  it('should return an error if block is invalid', (done) => {
    IpldBitcoin.resolver.tree(invalidBlock, (err, value) => {
      expect(value).to.not.exist()
      expect(err).to.be.an('error')
      done()
    })
  })
})

describe('IPLD format resolver API properties', () => {
  it('should have `multicodec` defined correctly', (done) => {
    expect(IpldBitcoin.resolver.multicodec).to.equal('bitcoin-block')
    done()
  })

  it('should have `defaultHashAlg` defined correctly', (done) => {
    expect(IpldBitcoin.resolver.defaultHashAlg).to.equal('dbl-sha2-256')
    done()
  })
})

const verifyPath = (block, path, expected, done) => {
  IpldBitcoin.resolver.resolve(block, path, (err, value) => {
    expect(err).to.not.exist()
    expect(value.remainderPath).is.empty()
    expect(value.value).is.equal(expected)
    done()
  })
}

const verifyError = (block, path, done) => {
  IpldBitcoin.resolver.resolve(block, path, (err, value) => {
    expect(value).to.not.exist()
    expect(err).to.be.an('error')
    done()
  })
}
