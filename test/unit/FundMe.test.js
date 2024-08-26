const { deployments, getNamedAccounts, ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { deploymentChains } = require("../../helper-hardhat-config");

network.config.chainId == 31337
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe;
      let mockV3Aggregator;
      const SEND_VALUE = ethers.utils.parseEther("1");
      const NUM_ACCOUNTS = 6;
      let deployer;
      let counter = 0;
      beforeEach(async () => {
        counter++;
        // console.log(`Hello, I'm beforeEach function I ran ${counter} times`);
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", () => {
        it("sets the aggregator address correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });
      describe("fund", () => {
        it("should send enough eth", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("should store the funder address correctly", async () => {
          await fundMe.fund({ value: SEND_VALUE });
          const amtStored = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(amtStored.toString(), SEND_VALUE.toString());
        });
        it("should add funder to funders array", async () => {
          await fundMe.fund({ value: SEND_VALUE });
          assert.equal((await fundMe.getFundersArray())[0], deployer);
        });
      });
      describe("withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: SEND_VALUE });
        });
        it("should withdraw funds correctly", async () => {
          const startingBalanceOfFundMe = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingBalanceoOfWithdrawel = await ethers.provider.getBalance(
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
            startingBalanceOfFundMe
              .add(startingBalanceoOfWithdrawel)
              .toString(),
            endingBalanceOfWithdrawel.add(gasPrice).toString()
          );
        });
        it("should work correctly with multiple funders", async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i <= NUM_ACCOUNTS; i++) {
            const connectedAccountOfNewFunder = await fundMe.connect(
              accounts[i]
            );
            await connectedAccountOfNewFunder.fund({ value: SEND_VALUE });
          }
          const fundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const sendValue = SEND_VALUE.toBigInt();
          const amtFundedByFunders = sendValue * BigInt(NUM_ACCOUNTS + 1);
          console.log(`FundMe balance: ${fundMeBalance}`);
          assert.equal(fundMeBalance.toString(), amtFundedByFunders.toString());
        });
        it("should only allow owner to withdraw funds", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const connectedAccountOfNewFunder = await fundMe.connect(attacker);
          await expect(
            connectedAccountOfNewFunder.withdraw()
          ).to.be.revertedWith("FundMe__NotOwner");
        });
        it("resets the storage variables after owner withdraws the fund", async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i <= NUM_ACCOUNTS; i++) {
            const connectedAccountOfNewFunder = await fundMe.connect(
              accounts[i]
            );
            await connectedAccountOfNewFunder.fund({ value: SEND_VALUE });
          }
          const fundersArray = await fundMe.getFundersArray();
          const fundersArraySize = fundersArray.length;
          assert.equal(fundersArraySize, NUM_ACCOUNTS + 1);
          for (i = 0; i <= NUM_ACCOUNTS; i++) {
            const funderAddress = fundersArray[i];
            assert.equal(funderAddress, accounts[i].address);
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              SEND_VALUE
            );
          }
          await fundMe.withdraw();
          const newFundersArray = await fundMe.getFundersArray();
          const newFundersArraySize = newFundersArray.length;
          assert.equal(newFundersArraySize, 0);
          for (i = 1; i <= NUM_ACCOUNTS; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
      describe("cheaperWithdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: SEND_VALUE });
        });
        it("should withdraw funds correctly", async () => {
          const startingBalanceOfFundMe = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingBalanceoOfWithdrawel = await ethers.provider.getBalance(
            deployer
          );
          const transactionReceipt = await fundMe.cheaperWithdraw();
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
            startingBalanceOfFundMe
              .add(startingBalanceoOfWithdrawel)
              .toString(),
            endingBalanceOfWithdrawel.add(gasPrice).toString()
          );
        });
        it("should work correctly with multiple funders", async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i <= NUM_ACCOUNTS; i++) {
            const connectedAccountOfNewFunder = await fundMe.connect(
              accounts[i]
            );
            await connectedAccountOfNewFunder.fund({ value: SEND_VALUE });
          }
          const fundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const sendValue = SEND_VALUE.toBigInt();
          const amtFundedByFunders = sendValue * BigInt(NUM_ACCOUNTS + 1);
          console.log(`FundMe balance: ${fundMeBalance}`);
          assert.equal(fundMeBalance.toString(), amtFundedByFunders.toString());
        });
        it("should only allow owner to withdraw funds", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const connectedAccountOfNewFunder = await fundMe.connect(attacker);
          await expect(
            connectedAccountOfNewFunder.cheaperWithdraw()
          ).to.be.revertedWith("FundMe__NotOwner");
        });
        it("resets the storage variables after owner withdraws the fund", async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i <= NUM_ACCOUNTS; i++) {
            const connectedAccountOfNewFunder = await fundMe.connect(
              accounts[i]
            );
            await connectedAccountOfNewFunder.fund({ value: SEND_VALUE });
          }
          const fundersArray = await fundMe.getFundersArray();
          const fundersArraySize = fundersArray.length;
          assert.equal(fundersArraySize, NUM_ACCOUNTS + 1);
          for (i = 0; i <= NUM_ACCOUNTS; i++) {
            const funderAddress = fundersArray[i];
            assert.equal(funderAddress, accounts[i].address);
            assert.equal(
              (
                await fundMe.getAddressToAmountFunded(accounts[i].address)
              ).toString(),
              SEND_VALUE
            );
          }
          await fundMe.cheaperWithdraw();
          const newFundersArray = await fundMe.getFundersArray();
          const newFundersArraySize = newFundersArray.length;
          assert.equal(newFundersArraySize, 0);
          for (i = 1; i <= NUM_ACCOUNTS; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
    });
