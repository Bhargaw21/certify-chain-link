
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./AccessControlManager.sol";
import "./CertificateStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ECertify
 * @dev Main contract for the E-Certify system
 */
contract ECertify is Ownable {
    AccessControlManager private accessControl;
    CertificateStorage private certificateStorage;
    
    // Events
    event StudentRegistered(address indexed student, address indexed institute);
    event CertificateUploaded(address indexed student, uint256 indexed certificateId, string ipfsHash);
    event CertificateApproved(address indexed student, uint256 indexed certificateId);
    event AccessGranted(address indexed student, address indexed viewer, uint256 indexed certificateId, uint256 duration);
    event InstituteChangeRequested(address indexed student, address indexed newInstitute);
    event InstituteChangeApproved(address indexed student, address indexed oldInstitute, address indexed newInstitute);
    
    // Modifiers
    modifier onlyStudent() {
        require(accessControl.isStudent(msg.sender), "Caller is not a student");
        _;
    }
    
    modifier onlyInstitute() {
        require(accessControl.isInstitute(msg.sender), "Caller is not an institute");
        _;
    }
    
    constructor(address _accessControl, address _certificateStorage) {
        accessControl = AccessControlManager(_accessControl);
        certificateStorage = CertificateStorage(_certificateStorage);
    }
    
    /**
     * @dev Registers a student
     * @param _name Name of the student (for event logging)
     * @param _email Email of the student (for event logging)
     * @param _institute Address of the institute
     */
    function registerStudent(string memory _name, string memory _email, address _institute) external {
        require(_institute != address(0), "Invalid institute address");
        require(accessControl.isInstitute(_institute), "Address is not a registered institute");
        
        // Grant student role to caller
        bytes32 studentRole = keccak256("STUDENT_ROLE");
        accessControl.grantStudentRole(msg.sender);
        
        // Register student in storage
        certificateStorage.registerStudent(msg.sender, _institute);
        
        emit StudentRegistered(msg.sender, _institute);
    }
    
    /**
     * @dev Registers an institute
     * @param _name Name of the institute (for event logging)
     * @param _email Email of the institute (for event logging)
     */
    function registerInstitute(string memory _name, string memory _email) external {
        // Grant institute role to caller
        bytes32 instituteRole = keccak256("INSTITUTE_ROLE");
        accessControl.grantInstituteRole(msg.sender);
        
        // Register institute in storage
        certificateStorage.registerInstitute(msg.sender);
    }
    
    /**
     * @dev Uploads a certificate for a student
     * @param _studentAddress Address of the student
     * @param _ipfsHash IPFS hash of the certificate
     */
    function uploadCertificate(address _studentAddress, string memory _ipfsHash) external onlyInstitute {
        require(accessControl.isStudent(_studentAddress), "Address is not a registered student");
        
        // Create certificate in storage
        uint256 certificateId = certificateStorage.createCertificate(_ipfsHash, msg.sender);
        
        // Link certificate to student
        certificateStorage.linkCertificateToStudent(_studentAddress, certificateId);
        
        emit CertificateUploaded(_studentAddress, certificateId, _ipfsHash);
    }
    
    /**
     * @dev Approves a certificate
     * @param _studentAddress Address of the student
     * @param _certificateId ID of the certificate
     */
    function approveCertificate(address _studentAddress, uint256 _certificateId) external onlyInstitute {
        require(accessControl.isStudent(_studentAddress), "Address is not a registered student");
        
        // Approve certificate in storage
        certificateStorage.approveCertificate(_certificateId);
        
        emit CertificateApproved(_studentAddress, _certificateId);
    }
    
    /**
     * @dev Grants access to a certificate
     * @param _viewerAddress Address of the viewer
     * @param _certificateId ID of the certificate
     * @param _duration Duration in seconds for which access is granted
     */
    function giveAccess(address _viewerAddress, uint256 _certificateId, uint256 _duration) external onlyStudent {
        // Grant access in storage
        certificateStorage.grantAccess(_certificateId, _viewerAddress, _duration);
        
        emit AccessGranted(msg.sender, _viewerAddress, _certificateId, _duration);
    }
    
    /**
     * @dev Requests a change of institute
     * @param _newInstituteAddress Address of the new institute
     */
    function changeInstituteRequest(address _newInstituteAddress) external onlyStudent {
        require(accessControl.isInstitute(_newInstituteAddress), "Address is not a registered institute");
        
        // Request institute change in storage
        certificateStorage.requestInstituteChange(msg.sender, _newInstituteAddress);
        
        emit InstituteChangeRequested(msg.sender, _newInstituteAddress);
    }
    
    /**
     * @dev Approves a change of institute request
     * @param _studentAddress Address of the student
     */
    function approveChangeInstituteRequest(address _studentAddress) external onlyInstitute {
        require(accessControl.isStudent(_studentAddress), "Address is not a registered student");
        
        // Get current institute of the student
        (,,address oldInstitute,) = certificateStorage.getCertificate(0); // Dummy call to compile
        address newInstitute = address(0); // Placeholder
        
        // Approve institute change in storage
        certificateStorage.approveInstituteChange(_studentAddress);
        
        emit InstituteChangeApproved(_studentAddress, oldInstitute, newInstitute);
    }
    
    /**
     * @dev Gets certificates of a student
     * @param _studentAddress Address of the student
     * @return Array of certificate IDs
     */
    function getStudentCertificates(address _studentAddress) external view returns (uint256[] memory) {
        require(accessControl.isStudent(_studentAddress), "Address is not a registered student");
        
        return certificateStorage.getStudentCertificates(_studentAddress);
    }
    
    /**
     * @dev Gets students linked to an institute
     * @param _instituteAddress Address of the institute
     * @return Array of student addresses
     */
    function getLinkedStudents(address _instituteAddress) external view returns (address[] memory) {
        require(accessControl.isInstitute(_instituteAddress), "Address is not a registered institute");
        
        return certificateStorage.getInstituteStudents(_instituteAddress);
    }
    
    /**
     * @dev Gets access logs for a certificate
     * @param _certificateId ID of the certificate
     * @return viewers Array of viewer addresses
     * @return timestamps Array of access timestamps
     */
    function getAccessLogs(uint256 _certificateId) external view returns (
        address[] memory viewers,
        uint256[] memory timestamps
    ) {
        return certificateStorage.getAccessLogs(_certificateId);
    }
}
