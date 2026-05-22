// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Pledge
 * @notice Make public on-chain commitments. Others can support your pledge.
 */
contract Pledge {
    event PledgeCreated(address indexed maker, uint256 indexed id, string pledge);
    event PledgeSupported(address indexed supporter, uint256 indexed pledgeId);

    struct PledgeEntry {
        uint256 id;
        address maker;
        string pledge;
        string category;  // e.g. "Health", "Environment", "Community"
        uint256 timestamp;
        uint256 supporters;
    }

    PledgeEntry[] public pledges;
    mapping(uint256 => mapping(address => bool)) public hasSupported;
    mapping(address => uint256[]) public myPledges;
    uint256 public totalPledges;

    function createPledge(string calldata pledge, string calldata category) external {
        require(bytes(pledge).length > 0, "Pledge required");

        uint256 id = pledges.length;
        pledges.push(PledgeEntry({
            id: id,
            maker: msg.sender,
            pledge: pledge,
            category: bytes(category).length > 0 ? category : "General",
            timestamp: block.timestamp,
            supporters: 0
        }));
        myPledges[msg.sender].push(id);
        totalPledges++;
        emit PledgeCreated(msg.sender, id, pledge);
    }

    function supportPledge(uint256 pledgeId) external {
        require(pledgeId < pledges.length, "Pledge not found");
        require(!hasSupported[pledgeId][msg.sender], "Already supported");
        require(pledges[pledgeId].maker != msg.sender, "Cannot support own pledge");

        hasSupported[pledgeId][msg.sender] = true;
        pledges[pledgeId].supporters++;
        emit PledgeSupported(msg.sender, pledgeId);
    }

    function getRecentPledges(uint256 count) external view returns (PledgeEntry[] memory) {
        uint256 len = pledges.length;
        uint256 start = len > count ? len - count : 0;
        PledgeEntry[] memory result = new PledgeEntry[](len - start);
        for (uint256 i = 0; i < result.length; i++) result[i] = pledges[start + i];
        return result;
    }
}
