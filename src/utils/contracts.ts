import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import {
  registerStudentInDB,
  registerInstituteInDB,
  uploadCertificateToDb,
  approveCertificateInDb,
  grantAccessInDb,
  requestInstituteChangeInDb,
  approveInstituteChangeInDb,
  getCertificatesForStudent,
  getStudentsForInstitute,
  getAccessLogsForCertificate,
  getPendingInstituteChangeRequests as getDbPendingInstituteChangeRequests,
  getPendingCertificatesForInstitute,
  getStudentIdFromAddress,
  getInstituteIdFromAddress
} from '@/services/supabase';

// ABI (Application Binary Interface) for our ECertify smart contract
// This ABI matches the contract we've created in ECertify.sol
const ECertifyContractABI = [
  // Student and Institute Registration
  "function registerStudent(string name, string email, address institute) external",
  "function registerInstitute(string name, string email) external",
  
  // Certificate Management
  "function uploadCertificate(address student, string ipfsHash) external",
  "function approveCertificate(address student, uint256 certificateId) external",
  
  // Access Management
  "function giveAccess(address viewer, uint256 certificateId, uint256 duration) external",
  
  // Institute Change
  "function changeInstituteRequest(address newInstitute) external",
  "function approveChangeInstituteRequest(address student) external",
  
  // View Functions
  "function getStudentCertificates(address student) external view returns (uint256[] memory)",
  "function getLinkedStudents(address institute) external view returns (address[] memory)",
  "function getAccessLogs(uint256 certificateId) external view returns (address[] memory, uint256[] memory)",
];

// Mock contract address - In production this would be your deployed contract address
const contractAddress = "0x8Bc75d6216051aBBB7C53Ec1C01E397A2bdE67a9";

// Get the ECertify contract instance
export const getECertifyContract = (signer: ethers.Signer) => {
  return new ethers.Contract(contractAddress, ECertifyContractABI, signer);
};

// Export the helper functions for use in other parts of the application
export { getStudentIdFromAddress, getInstituteIdFromAddress };

// Register a student with the smart contract
export const registerStudent = async (
  signer: ethers.Signer,
  name: string,
  email: string,
  instituteAddress: string
): Promise<boolean> => {
  try {
    console.log(`Registering student: ${name}, ${email}, to institute: ${instituteAddress}`);
    
    const userAddress = await signer.getAddress();
    console.log("Student wallet address:", userAddress);
    
    // Save to database
    await registerStudentInDB(userAddress, name, email, instituteAddress);
    console.log("Student registered in database successfully");
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error("Error registering student:", error);
    return false;
  }
};

// Register an institute with the smart contract
export const registerInstitute = async (
  signer: ethers.Signer,
  name: string,
  email: string
): Promise<boolean> => {
  try {
    console.log(`Registering institute: ${name}, ${email}`);
    
    const instituteAddress = await signer.getAddress();
    console.log("Institute wallet address:", instituteAddress);
    
    // Save to database
    const instituteId = await registerInstituteInDB(instituteAddress, name, email);
    console.log("Institute registered in database successfully with ID:", instituteId);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error("Error registering institute:", error);
    return false;
  }
};

// Upload a certificate for a student
export const uploadCertificate = async (
  signer: ethers.Signer,
  studentAddress: string,
  ipfsHash: string
): Promise<boolean> => {
  try {
    console.log(`Uploading certificate for student ${studentAddress} with IPFS hash: ${ipfsHash}`);
    
    const instituteAddress = await signer.getAddress();
    
    // Get IDs for database
    const studentId = await getStudentIdFromAddress(studentAddress);
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    if (!studentId || !instituteId) {
      throw new Error("Student or institute not found");
    }
    
    // Save to database
    await uploadCertificateToDb(studentId, instituteId, ipfsHash);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    return false;
  }
};

// Approve a certificate for a student
export const approveCertificate = async (
  signer: ethers.Signer,
  certificateId: string
): Promise<boolean> => {
  try {
    console.log(`Approving certificate ${certificateId}`);
    
    // Save to database
    await approveCertificateInDb(certificateId);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error approving certificate:", error);
    return false;
  }
};

// Grant access to a certificate
export const giveAccess = async (
  signer: ethers.Signer,
  viewerAddress: string,
  certificateId: string,
  durationInDays: number
): Promise<boolean> => {
  try {
    // Convert days to hours for the database
    const durationInHours = durationInDays * 24;
    
    console.log(`Granting access to ${viewerAddress} for certificate ${certificateId} for ${durationInDays} days`);
    
    const studentAddress = await signer.getAddress();
    const studentId = await getStudentIdFromAddress(studentAddress);
    
    if (!studentId) {
      throw new Error("Student not found");
    }
    
    // Save to database
    await grantAccessInDb(certificateId, viewerAddress, studentId, durationInHours);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error granting access:", error);
    return false;
  }
};

// Request a change of institute
export const requestInstituteChange = async (
  signer: ethers.Signer,
  newInstituteAddress: string
): Promise<boolean> => {
  try {
    console.log(`Requesting change to institute ${newInstituteAddress}`);
    
    const studentAddress = await signer.getAddress();
    const studentId = await getStudentIdFromAddress(studentAddress);
    
    if (!studentId) {
      throw new Error("Student not found");
    }
    
    // Get the student's current institute
    const { data: student } = await getStudentByAddress(studentAddress);
    if (!student || !student.current_institute_id) {
      throw new Error("Student has no current institute");
    }
    
    // Get the requested institute ID
    const newInstituteId = await getInstituteIdFromAddress(newInstituteAddress);
    if (!newInstituteId) {
      // Create the institute with a placeholder
      await registerInstituteInDB(
        newInstituteAddress,
        `Institute (${newInstituteAddress.substring(0, 6)}...)`,
        `institute-${newInstituteAddress.substring(0, 6)}@placeholder.com`
      );
      const newId = await getInstituteIdFromAddress(newInstituteAddress);
      if (!newId) {
        throw new Error("Failed to create institute");
      }
      
      // Save to database
      await requestInstituteChangeInDb(studentId, student.current_institute_id, newId);
    } else {
      // Save to database
      await requestInstituteChangeInDb(studentId, student.current_institute_id, newInstituteId);
    }
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error requesting institute change:", error);
    return false;
  }
};

// Approve a change of institute request
export const approveInstituteChange = async (
  signer: ethers.Signer,
  requestId: string,
  studentId: string
): Promise<boolean> => {
  try {
    console.log(`Approving institute change request for request ${requestId}`);
    
    const instituteAddress = await signer.getAddress();
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    if (!instituteId) {
      throw new Error("Institute not found");
    }
    
    // Save to database
    await approveInstituteChangeInDb(requestId, studentId, instituteId);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error approving institute change:", error);
    return false;
  }
};

// Get certificates of a student
export const getStudentCertificates = async (
  signer: ethers.Signer,
  studentAddress: string
): Promise<{ id: string, ipfsHash: string, approved: boolean, issuer: string, timestamp: number }[]> => {
  try {
    console.log(`Getting certificates for student ${studentAddress}`);
    
    const studentId = await getStudentIdFromAddress(studentAddress);
    
    if (!studentId) {
      return [];
    }
    
    // Get from database
    const certificates = await getCertificatesForStudent(studentId);
    
    // Map to the expected format
    return certificates.map(cert => ({
      id: cert.id,
      ipfsHash: cert.ipfs_hash,
      approved: cert.is_approved,
      issuer: cert.institute?.address || "",
      timestamp: new Date(cert.timestamp).getTime()
    }));
  } catch (error) {
    console.error("Error getting student certificates:", error);
    return [];
  }
};

// Get students linked to an institute
export const getLinkedStudents = async (
  signer: ethers.Signer
): Promise<{ address: string; name: string }[]> => {
  try {
    const instituteAddress = await signer.getAddress();
    console.log(`Getting students linked to institute ${instituteAddress}`);
    
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    if (!instituteId) {
      return [];
    }
    
    // Get from database
    const students = await getStudentsForInstitute(instituteId);
    
    // Return in the expected format
    return students.map(student => ({
      address: student.address,
      name: student.name
    }));
  } catch (error) {
    console.error("Error getting linked students:", error);
    return [];
  }
};

// Get access logs for a certificate
export const getAccessLogs = async (
  signer: ethers.Signer,
  certificateId: string
): Promise<{ viewer: string; timestamp: number }[]> => {
  try {
    console.log(`Getting access logs for certificate ${certificateId}`);
    
    // Get from database
    const logs = await getAccessLogsForCertificate(certificateId);
    
    // Map to the expected format
    return logs.map(log => ({
      viewer: log.viewer_address,
      timestamp: new Date(log.timestamp).getTime()
    }));
  } catch (error) {
    console.error("Error getting access logs:", error);
    return [];
  }
};

// Get pending institute change requests - renamed from the imported function
export const getPendingInstituteChangeRequests = async (
  signer: ethers.Signer
): Promise<{ requestId: string; studentAddress: string; studentName: string; studentId: string }[]> => {
  try {
    const instituteAddress = await signer.getAddress();
    console.log(`Getting pending institute change requests for institute ${instituteAddress}`);
    
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    if (!instituteId) {
      return [];
    }
    
    // Get from database using the renamed import
    const requests = await getDbPendingInstituteChangeRequests(instituteId);
    
    // Return in the expected format
    return requests.map(request => ({
      requestId: request.id,
      studentAddress: request.student?.address || "",
      studentName: request.student?.name || "",
      studentId: request.student_id
    }));
  } catch (error) {
    console.error("Error getting pending institute change requests:", error);
    return [];
  }
};

// Get certificates pending approval for an institute
export const getPendingCertificates = async (
  signer: ethers.Signer
): Promise<{ id: string; studentAddress: string; studentName: string; ipfsHash: string; timestamp: number }[]> => {
  try {
    const instituteAddress = await signer.getAddress();
    console.log(`Getting pending certificates for institute ${instituteAddress}`);
    
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    if (!instituteId) {
      return [];
    }
    
    // Get from database
    const certificates = await getPendingCertificatesForInstitute(instituteId);
    
    // Return in the expected format
    return certificates.map(cert => ({
      id: cert.id,
      studentAddress: cert.student?.address || "",
      studentName: cert.student?.name || "",
      ipfsHash: cert.ipfs_hash,
      timestamp: new Date(cert.timestamp).getTime()
    }));
  } catch (error) {
    console.error("Error getting pending certificates:", error);
    return [];
  }
};

// Helper function needed by other functions
export const getStudentByAddress = async (address: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('address', address)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error getting student by address:", error);
    throw error;
  }

  return { data };
};
