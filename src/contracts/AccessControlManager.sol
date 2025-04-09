
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccessControlManager
 * @dev Manages roles and permissions for the E-Certify system
 */
contract AccessControlManager is AccessControl, Ownable {
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant INSTITUTE_ROLE = keccak256("INSTITUTE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _msgSender());
        
        // Admin can manage all roles
        _setRoleAdmin(STUDENT_ROLE, ADMIN_ROLE);
        _setRoleAdmin(INSTITUTE_ROLE, ADMIN_ROLE);
    }
    
    /**
     * @dev Grants student role to an address
     * @param student Address of the student
     */
    function grantStudentRole(address student) external onlyRole(ADMIN_ROLE) {
        grantRole(STUDENT_ROLE, student);
    }
    
    /**
     * @dev Grants institute role to an address
     * @param institute Address of the institute
     */
    function grantInstituteRole(address institute) external onlyRole(ADMIN_ROLE) {
        grantRole(INSTITUTE_ROLE, institute);
    }
    
    /**
     * @dev Revokes student role from an address
     * @param student Address of the student
     */
    function revokeStudentRole(address student) external onlyRole(ADMIN_ROLE) {
        revokeRole(STUDENT_ROLE, student);
    }
    
    /**
     * @dev Revokes institute role from an address
     * @param institute Address of the institute
     */
    function revokeInstituteRole(address institute) external onlyRole(ADMIN_ROLE) {
        revokeRole(INSTITUTE_ROLE, institute);
    }
    
    /**
     * @dev Checks if an address has student role
     * @param account Address to check
     * @return bool True if the address has student role
     */
    function isStudent(address account) external view returns (bool) {
        return hasRole(STUDENT_ROLE, account);
    }
    
    /**
     * @dev Checks if an address has institute role
     * @param account Address to check
     * @return bool True if the address has institute role
     */
    function isInstitute(address account) external view returns (bool) {
        return hasRole(INSTITUTE_ROLE, account);
    }
}
