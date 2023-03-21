const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect, use } = require('chai');
const { ethers } = require('hardhat');
const { solidity } = require("ethereum-waffle");

use(solidity);

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy();

    const [owner, notOwner] = await ethers.getSigners();
    let withdrawAmount = ethers.utils.parseUnits("1", "ether");

    console.log('Signer 1 address: ', owner.address);
    return { faucet, owner, withdrawAmount, notOwner };
  }

  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it('should not allow withdrawals above .1 ETH at a time', async function () {
    const { faucet,  withdrawAmount } = await loadFixture(deployContractAndSetVariables);

    expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  it('should only the contract owner can remove all funds and destruct the contract', async function () {
    const { faucet, notOwner } = await loadFixture(deployContractAndSetVariables);

    expect(faucet.connect(notOwner).destroyFaucet()).to.be.reverted;
  });

  it('should the contract self destruct', async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);
    faucet.destroyFaucet();

    let faucetCode = await ethers.provider.getCode(faucet.address);

    expect(faucetCode).to.equal("0x");
  });

  it('should the contract balance be empty', async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);
    faucet.withdrawAll();

    let faucetBalance = await ethers.provider.getBalance(faucet.address);

    expect(faucetBalance).to.equal(0);
  });
});
