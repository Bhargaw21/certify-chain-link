
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificateStorage
 * @dev Stores certificate data and provides access control methods
 */
contract CertificateStorage is Ownable {
    struct Certificate {
        string ipfsHash;
        uint256 timestamp;
        address issuer;
        bool isApproved;
        mapping(address => bool) accessGranted;
        mapping(address => uint256) accessExpiry;
    }
    
    struct Student {
        address studentAddress;
        address currentInstitute;
        address requestedInstitute;
        uint256[] certificateIds;
    }
    
    struct Institute {
        address instituteAddress;
        bool isRegistered;
    }
    
    // Mapping to store certificates by their unique ID
    mapping(uint256 => Certificate) private certificates;
    uint256 private nextCertificateId;
    
    // Mapping of student addresses to their data
    mapping(address => Student) private students;
    
    // Mapping of institute addresses to their data
    mapping(address => Institute) private institutes;
    
    // Mapping to track students linked to institutes
    mapping(address => address[]) private instituteToStudents;
    
    // Access logs for each certificate
    struct AccessLog {
        address viewer;
        uint256 timestamp;
    }
    
    // Mapping of certificate IDs to their access logs
    mapping(uint256 => AccessLog[]) private accessLogs;
    
    // Contract that manages access control
    address private accessControlContract;
    
    // Only allow authorized callers
    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == accessControlContract, "Not authorized");
        _;
    }
    
    /**
     * @dev Sets the address of the access control contract
     * @param _accessControlContract Address of the access control contract
     */
    function setAccessControlContract(address _accessControlContract) external onlyOwner {
        accessControlContract = _accessControlContract;
    }
    
    /**
     * @dev Creates a new certificate and returns its ID
     * @param _ipfsHash IPFS hash of the certificate
     * @param _issuer Address of the certificate issuer
     * @return certificateId ID of the created certificate
     */
    function createCertificate(string memory _ipfsHash, address _issuer) external onlyAuthorized returns (uint256) {
        uint256 certificateId = nextCertificateId++;
        
        Certificate storage cert = certificates[certificateId];
        cert.ipfsHash = _ipfsHash;
        cert.timestamp = block.timestamp;
        cert.issuer = _issuer;
        cert.isApproved = false;
        
        return certificateId;
    }
    
    /**
     * @dev Approves a certificate
     * @param _certificateId ID of the certificate
     */
    function approveCertificate(uint256 _certificateId) external onlyAuthorized {
        require(_certificateId < nextCertificateId, "Certificate does not exist");
        certificates[_certificateId].isApproved = true;
    }
    
    /**
     * @dev Gets certificate data
     * @param _certificateId ID of the certificate
     * @return ipfsHash IPFS hash of the certificate
     * @return timestamp Timestamp when the certificate was created
     * @return issuer Address of the issuer
     * @return isApproved Approval status of the certificate
     */
    function getCertificate(uint256 _certificateId) external view returns (
        string memory ipfsHash,
        uint256 timestamp,
        address issuer,
        bool isApproved
    ) {
        require(_certificateId < nextCertificateId, "Certificate does not exist");
        Certificate storage cert = certificates[_certificateId];
        
        return (
            cert.ipfsHash,
            cert.timestamp,
            cert.issuer,
            cert.isApproved
        );
    }
    
    /**
     * @dev Grants access to a certificate
     * @param _certificateId ID of the certificate
     * @param _viewer Address of the viewer
     * @param _duration Duration in seconds for which access is granted
     */
    function grantAccess(uint256 _certificateId, address _viewer, uint256 _duration) external onlyAuthorized {
        require(_certificateId < nextCertificateId, "Certificate does not exist");
        Certificate storage cert = certificates[_certificateId];
        
        cert.accessGranted[_viewer] = true;
        cert.accessExpiry[_viewer] = block.timestamp + _duration;
        
        // Log the access
        accessLogs[_certificateId].push(AccessLog({
            viewer: _viewer,
            timestamp: block.timestamp
        }));
    }
    
    /**
     * @dev Checks if a viewer has access to a certificate
     * @param _certificateId ID of the certificate
     * @param _viewer Address of the viewer
     * @return hasAccess True if the viewer has access
     */
    function hasAccess(uint256 _certificateId, address _viewer) external view returns (bool) {
        require(_certificateId < nextCertificateId, "Certificate does not exist");
        Certificate storage cert = certificates[_certificateId];
        
        return cert.accessGranted[_viewer] && cert.accessExpiry[_viewer] >= block.timestamp;
    }
    
    /**
     * @dev Registers a student
     * @param _student Address of the student
     * @param _institute Address of the institute
     */
    function registerStudent(address _student, address _institute) external onlyAuthorized {
        Student storage student = students[_student];
        student.studentAddress = _student;
        student.currentInstitute = _institute;
        
        // Link the student to the institute
        instituteToStudents[_institute].push(_student);
    }
    
    /**
     * @dev Registers an institute
     * @param _institute Address of the institute
     */
    function registerInstitute(address _institute) external onlyAuthorized {
        Institute storage institute = institutes[_institute];
        institute.instituteAddress = _institute;
        institute.isRegistered = true;
    }
    
    /**
     * @dev Links a certificate to a student
     * @param _student Address of the student
     * @param _certificateId ID of the certificate
     */
    function linkCertificateToStudent(address _student, uint256 _certificateId) external onlyAuthorized {
        require(_certificateId < nextCertificateId, "Certificate does not exist");
        students[_student].certificateIds.push(_certificateId);
    }
    
    /**
     * @dev Gets all certificates of a student
     * @param _student Address of the student
     * @return certificateIds Array of certificate IDs
     */
    function getStudentCertificates(address _student) external view returns (uint256[] memory) {
        return students[_student].certificateIds;
    }
    
    /**
     * @dev Requests a change of institute for a student
     * @param _student Address of the student
     * @param _newInstitute Address of the new institute
     */
    function requestInstituteChange(address _student, address _newInstitute) external onlyAuthorized {
        students[_student].requestedInstitute = _newInstitute;
    }
    
    /**
     * @dev Approves a change of institute for a student
     * @param _student Address of the student
     */
    function approveInstituteChange(address _student) external onlyAuthorized {
        Student storage student = students[_student];
        address oldInstitute = student.currentInstitute;
        address newInstitute = student.requestedInstitute;
        
        require(newInstitute != address(0), "No institute change requested");
        
        // Remove student from old institute
        address[] storage oldInstituteStudents = instituteToStudents[oldInstitute];
        for (uint256 i = 0; i < oldInstituteStudents.length; i++) {
            if (oldInstituteStudents[i] == _student) {
                // Swap with the last element and pop
                oldInstituteStudents[i] = oldInstituteStudents[oldInstituteStudents.length - 1];
                oldInstituteStudents.pop();
                break;
            }
        }
        
        // Add student to new institute
        instituteToStudents[newInstitute].push(_student);
        
        // Update student's institute
        student.currentInstitute = newInstitute;
        student.requestedInstitute = address(0);
    }
    
    /**
     * @dev Gets all students linked to an institute
     * @param _institute Address of the institute
     * @return Array of student addresses
     */
    function getInstituteStudents(address _institute) external view returns (address[] memory) {
        return instituteToStudents[_institute];
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
        AccessLog[] storage logs = accessLogs[_certificateId];
        uint256 logsCount = logs.length;
        
        viewers = new address[](logsCount);
        timestamps = new uint256[](logsCount);
        
        for (uint256 i = 0; i < logsCount; i++) {
            viewers[i] = logs[i].viewer;
            timestamps[i] = logs[i].timestamp;
        }
        
        return (viewers, timestamps);
    }
}
