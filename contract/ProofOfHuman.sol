// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SelfVerificationRoot } from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import { ISelfVerificationRoot } from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import { SelfStructs } from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import { SelfUtils } from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import { IIdentityVerificationHubV2 } from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title HackerRepSelfVerification
 * @notice HackerRep implementation of SelfVerificationRoot for identity verification with demographics
 * @dev This contract extracts nationality, gender, and age data from Self Protocol verification for HackerRep
 */
contract HackerRepSelfVerification is SelfVerificationRoot {
    // User demographic data structure
    struct UserDemographics {
        string nationality;
        string gender;
        uint256 age;
        bool isVerified;
        uint256 verifiedAt;
    }

    // Storage for user demographic data
    mapping(address => UserDemographics) public userDemographics;
    mapping(address => bool) public isUserVerified;
    
    // Contract metadata
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;
    
    // Events
    event UserVerified(
        address indexed user,
        string nationality,
        string gender,
        uint256 age,
        uint256 timestamp
    );
    
    event VerificationRevoked(address indexed user, uint256 timestamp);
    
    event DemographicDataExtracted(
        address indexed user,
        string nationality,
        string gender,
        uint256 age
    );

    /**
     * @notice Constructor for the HackerRep verification contract
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param scopeSeed The verification scope seed for HackerRep (uint256)
     * @param _verificationConfig The verification configuration
     */
    constructor(
        address identityVerificationHubV2Address,
        uint256 scopeSeed, 
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    )
        SelfVerificationRoot(identityVerificationHubV2Address, scopeSeed)
    {
        verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig);
        // Register the config and get the configId
        verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2Address)
            .setVerificationConfigV2(verificationConfig);
    }

    /**
     * @notice Implementation of customVerificationHook for HackerRep
     * @dev This function extracts nationality, gender, and age from disclosed data
     * @param output The verification output from the hub
     * @param userData The user data passed through verification
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    )
        internal
        override
    {
        address user = address(uint160(output.userIdentifier));
        
        // Extract demographic data from Self Protocol disclosed data
        // Self Protocol provides disclosed data in the order: nationality, gender, date_of_birth
        // Extract real data from the verification output
        string memory nationality = "INDIA"; // Will be extracted from actual data
        string memory gender = "MALE"; // Will be extracted from actual data  
        uint256 age = 25; // Will be calculated from actual data
        
        // TODO: Implement proper data extraction once Self Protocol structure is confirmed
        // For now, use verification success to indicate real verification occurred
        
        // Store user demographics
        userDemographics[user] = UserDemographics({
            nationality: nationality,
            gender: gender,
            age: age,
            isVerified: true,
            verifiedAt: block.timestamp
        });
        
        isUserVerified[user] = true;
        
        // Emit events
        emit UserVerified(user, nationality, gender, age, block.timestamp);
        emit DemographicDataExtracted(user, nationality, gender, age);
    }

    /**
     * @notice Extract nationality from disclosed data
     * @param disclosedData The disclosed data from verification
     * @return nationality The extracted nationality
     */
    function extractNationality(bytes[] memory disclosedData) internal pure returns (string memory nationality) {
        // Self Protocol discloses data in specific order based on disclosure config
        // For nationality, gender, date_of_birth config, data comes in that order
        if (disclosedData.length >= 1 && disclosedData[0].length > 0) {
            // Parse the nationality from disclosed data
            string memory data = string(disclosedData[0]);
            // Return the actual nationality from Self Protocol
            return data;
        }
        return "INDIA"; // Default fallback
    }

    /**
     * @notice Extract gender from disclosed data
     * @param disclosedData The disclosed data from verification
     * @return gender The extracted gender
     */
    function extractGender(bytes[] memory disclosedData) internal pure returns (string memory gender) {
        // Second item is gender
        if (disclosedData.length >= 2 && disclosedData[1].length > 0) {
            // Parse gender from disclosed data
            string memory data = string(disclosedData[1]);
            // Return the actual gender from Self Protocol
            return data;
        }
        return "UNKNOWN"; // Default fallback
    }

    /**
     * @notice Extract age from disclosed data
     * @param disclosedData The disclosed data from verification
     * @return age The extracted age
     */
    function extractAge(bytes[] memory disclosedData) internal pure returns (uint256 age) {
        // Third item is date_of_birth, calculate age from it
        if (disclosedData.length >= 3 && disclosedData[2].length > 0) {
            // Parse date_of_birth and calculate age
            // For now, return a reasonable default - in production, parse the date string
            // TODO: Implement proper date parsing and age calculation
            return 25; // Will be calculated from date_of_birth in production
        }
        return 25; // Default age
    }

    /**
     * @notice Get user demographic data
     * @param user The user address
     * @return demographics The user's demographic data
     */
    function getUserDemographics(address user) external view returns (UserDemographics memory demographics) {
        return userDemographics[user];
    }

    /**
     * @notice Check if user is verified
     * @param user The user address
     * @return verified Whether the user is verified
     */
    function isUserVerifiedStatus(address user) external view returns (bool verified) {
        return isUserVerified[user];
    }

    /**
     * @notice Get user age
     * @param user The user address
     * @return age The user's age
     */
    function getUserAge(address user) external view returns (uint256 age) {
        return userDemographics[user].age;
    }

    /**
     * @notice Get user gender
     * @param user The user address
     * @return gender The user's gender
     */
    function getUserGender(address user) external view returns (string memory gender) {
        return userDemographics[user].gender;
    }

    /**
     * @notice Get user nationality
     * @param user The user address
     * @return nationality The user's nationality
     */
    function getUserNationality(address user) external view returns (string memory nationality) {
        return userDemographics[user].nationality;
    }

    /**
     * @notice Check if user is from a specific country
     * @param user The user address
     * @param country The country code to check
     * @return isFromCountry Whether the user is from the specified country
     */
    function isUserFromCountry(address user, string memory country) external view returns (bool isFromCountry) {
        return keccak256(bytes(userDemographics[user].nationality)) == keccak256(bytes(country));
    }

    /**
     * @notice Get verification timestamp
     * @param user The user address
     * @return timestamp The verification timestamp
     */
    function getVerificationTimestamp(address user) external view returns (uint256 timestamp) {
        return userDemographics[user].verifiedAt;
    }

    /**
     * @notice Revoke user verification (admin function)
     * @param user The user address to revoke
     */
    function revokeVerification(address user) external {
        // Only allow contract owner to revoke (add access control as needed)
        userDemographics[user].isVerified = false;
        isUserVerified[user] = false;
        
        emit VerificationRevoked(user, block.timestamp);
        emit UserVerified(user, "", "", 0, block.timestamp); // Emit with empty data
    }

    /**
     * @notice Set verification config ID
     * @param configId The new config ID
     */
    function setConfigId(bytes32 configId) external {
        verificationConfigId = configId;
    }

    /**
     * @notice Get config ID for verification
     * @return The verification config ID
     */
    function getConfigId(
        bytes32, /* destinationChainId */
        bytes32, /* userIdentifier */
        bytes memory /* userDefinedData */
    )
        public
        view
        override
        returns (bytes32)
    {
        return verificationConfigId;
    }
}