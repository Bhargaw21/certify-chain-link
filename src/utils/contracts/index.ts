
// Export core utilities
export {
  getECertifyContract,
  getStudentIdFromAddress,
  getInstituteIdFromAddress,
  getStudentByAddress,
  contractAddress,
  ECertifyContractABI
} from './core';

// Export student operations
export {
  registerStudent,
  getStudentCertificates,
  giveAccess,
  requestInstituteChange
} from './studentOperations';

// Export institute operations
export {
  registerInstitute,
  getLinkedStudents,
  getPendingInstituteChangeRequests,
  approveInstituteChange
} from './instituteOperations';

// Export certificate operations
export {
  uploadCertificate,
  approveCertificate,
  getPendingCertificates,
  getAccessLogs
} from './certificateOperations';
