const { deploymentChains } = require("../../helper-hardhat-config");
const { network, ethers, getNamedAccounts } = require("hardhat");
const { assert } = require("chai");

// network.config.chainId == 31337
//   ? describe.skip
//   :
describe("FundMe staging testing", () => {
  let deployer, fundMe;
  const SEND_VALUE = ethers.utils.parseEther("1");
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    fundMe = await ethers.getContract("FundMe", deployer);
  });
  it("has the initial balance 0", async () => {
    const balance = await ethers.provider.getBalance(fundMe.address);
    assert.equal(balance, 0);
  });
  it("updates the balance when funded", async () => {
    await fundMe.fund({ value: SEND_VALUE });
    const balance = await ethers.provider.getBalance(fundMe.address);
    assert.equal(balance.toString(), SEND_VALUE);
  });
  it("allows the owner to withdraw fund", async () => {
    const startingBalanceOfFundMe = await ethers.provider.getBalance(
      fundMe.address
    );
    const startingBalanceOfWithdrawel = await ethers.provider.getBalance(
      deployer
    );
    const transactionReceipt = await fundMe.withdraw();
    const transactionResponse = await transactionReceipt.wait(1);
    const endingBalanceOfFundMe = await ethers.provider.getBalance(
      fundMe.address
    );
    const endingBalanceOfWithdrawel = await ethers.provider.getBalance(
      deployer
    );
    const { gasUsed, effectiveGasPrice } = transactionResponse;
    const gasPrice = gasUsed.mul(effectiveGasPrice);
    assert.equal(endingBalanceOfFundMe.toString(), "0");
    assert.equal(
      startingBalanceOfFundMe.add(startingBalanceOfWithdrawel).toString(),
      endingBalanceOfWithdrawel.add(gasPrice).toString()
    );
  });
});
