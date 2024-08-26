// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

error FundMe__NotOwner();

/**
 * @title My FundMe contract
 * @author Aniket Jejurkar
 * @notice This is a fundme contract that collects funds and only withdrawn by the contract creator
 * @dev This contract implements AggregatorV3Interface
 */

contract FundMe {
    //Type Declaration
    using PriceConverter for uint256;

    //State Variables
    mapping(address => uint256) private addressToAmountFunded;
    address[] public s_funders;
    AggregatorV3Interface s_priceFeed;
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    //Events

    //Modifiers
    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    //Functions

    /* constructor */
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
        console.log("contract deployed by %s", i_owner);
        // console.log("s_priceFeed: %s", s_priceFeed);
    }

    /* receive function */
    receive() external payable {
        fund();
    }

    /* fallback function */
    fallback() external payable {
        fund();
    }

    /* external function */

    /* public function */
    function fund() public payable {
        console.log("fund function is called by %s", msg.sender);
        console.log("Eth amount send by funder is %s", msg.value);
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        console.log("%s amount satisfy the minimum required amount", msg.value);
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        console.log("FundMe balance: %s", address(this).balance);
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    /* internal function */

    /* private function */

    /* view/pure function */
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return addressToAmountFunded[funder];
    }

    function getOwnerAddress() public view returns (address) {
        return i_owner;
    }

    function getFundersArray() public view returns (address[] memory) {
        return s_funders;
    }

    function getBalanceOfFundMe() public view returns (uint256) {
        return address(this).balance;
    }
}
