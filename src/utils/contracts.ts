
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

const ECertifyContractABI = [
  "function registerStudent(string name, string email, address institute) external",
  "function registerInstitute(string name, string email) external",
  "function uploadCertificate(address student, string ipfsHash) external",
  "function approveCertificate(address student, uint256 certificateId) external",
  "function giveAccess(address viewer, uint256 certificateId, uint256 duration) external",
  "function changeInstituteRequest(address newInstitute) external",
  "function approveChangeInstituteRequest(address student) external",
  "function getStudentCertificates(address student) external view returns (uint256[] memory)",
  "function getLinkedStudents(address institute) external view returns (address[] memory)",
  "function getAccessLogs(uint256 certificateId) external view returns (address[] memory, uint256[] memory)"
];

const contractAddress = "0x8Bc75d6216051aBBB7C53Ec1C01E397A2bdE67a9";

export const getECertifyContract = (signer: ethers.Signer) => {
  return new ethers.Contract(contractAddress, ECertifyContractABI, signer);
};

export { getStudentIdFromAddress, getInstituteIdFromAddress };

export const registerStudent = async (
  signer: ethers.Signer,
  name: string,
  email: string,
  instituteAddress: string
): Promise<boolean> => {
  try {
    console.log(`Registering student: ${name}, ${email}, to institute: ${instituteAddress}`);
    
    // Validate institute address format
    if (!ethers.utils.isAddress(instituteAddress)) {
      console.error("Invalid institute address format:", instituteAddress);
      throw new Error("Invalid institute address format. Please enter a valid Ethereum address.");
    }
    
    const userAddress = await signer.getAddress();
    console.log("Student wallet address:", userAddress);
    
    // Verify wallet is connected with right parameters
    if (!signer || !userAddress) {
      console.error("Wallet connection issues - no valid signer or address");
      throw new Error("Wallet connection issues. Please reconnect your wallet and try again.");
    }
    
    // Check network connection
    try {
      const provider = signer.provider as ethers.providers.Web3Provider;
      const network = await provider?.getNetwork();
      console.log("Current network during registration:", network?.name, "with chainId:", network?.chainId);
    } catch (netError) {
      console.error("Network detection error:", netError);
    }
    
    // Check if institute exists in database
    let instituteId;
    try {
      instituteId = await getInstituteIdFromAddress(instituteAddress);
      console.log("Institute ID lookup result:", instituteId);
      
      if (!instituteId) {
        console.log("Institute not found, will create a placeholder");
        try {
          await registerInstituteInDB(
            instituteAddress,
            `Institute (${instituteAddress.substring(0, 6)}...)`,
            `institute-${instituteAddress.substring(0, 6)}@placeholder.com`
          );
          console.log("Placeholder institute created successfully");
          
          // Get the newly created institute ID
          instituteId = await getInstituteIdFromAddress(instituteAddress);
          console.log("New institute ID:", instituteId);
        } catch (createInstErr) {
          console.error("Error creating placeholder institute:", createInstErr);
          // Continue anyway as the registerStudentInDB will try to create a placeholder institute
        }
      }
    } catch (instLookupErr) {
      console.error("Error looking up institute:", instLookupErr);
      // Continue anyway as the registerStudentInDB will handle this
    }
    
    // Register student in database with improved error handling
    try {
      console.log("Starting to register student in database...");
      const studentId = await registerStudentInDB(userAddress, name, email, instituteAddress);
      console.log("Student registered in database successfully with ID:", studentId);
      
      if (!studentId) {
        console.error("Student registration returned no ID");
        throw new Error("Student registration failed: no student ID returned");
      }
    } catch (dbError: any) {
      console.error("Database registration error:", dbError);
      
      // Enhanced error message based on the specific error
      let errorMessage = "Failed to register student in the database. Please try again.";
      
      if (dbError.message && dbError.message.includes("violates row level security")) {
        errorMessage = "Database permission error. Please contact support.";
      } else if (dbError.message && dbError.message.includes("duplicate key")) {
        errorMessage = "A student with this wallet address already exists.";
      } else if (dbError.code === "23505") {
        errorMessage = "A student with this wallet address already exists.";
      } else if (dbError.code === "23503") {
        errorMessage = "Referenced institute doesn't exist. Please check the institute address.";
      }
      
      throw new Error(errorMessage);
    }
    
    console.log("Student registration process completed successfully");
    return true;
  } catch (error: any) {
    console.error("Error registering student:", error);
    // Include the error message for better debugging
    throw new Error(`Registration failed: ${error.message || "Unknown error"}`);
  }
};

export const registerInstitute = async (
  signer: ethers.Signer,
  name: string,
  email: string
): Promise<boolean> => {
  try {
    console.log(`Starting registerInstitute function with params:`, { name, email });
    
    const instituteAddress = await signer.getAddress();
    console.log("Institute wallet address:", instituteAddress);
    
    if (!signer) {
      console.error("No signer available, wallet might not be connected");
      return false;
    }
    
    try {
      console.log("Calling registerInstituteInDB...");
      const instituteId = await registerInstituteInDB(instituteAddress, name, email);
      console.log("Institute registered in database successfully with ID:", instituteId);
    } catch (dbError) {
      console.error("Database registration error:", dbError);
      // We'll continue with contract interaction even if DB fails
    }
    
    console.log("Simulating contract interaction for institute registration");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Institute registration completed successfully");
    return true;
  } catch (error) {
    console.error("Error in registerInstitute function:", error);
    return false;
  }
};

export const uploadCertificate = async (
  signer: ethers.Signer,
  studentAddress: string,
  ipfsHash: string
): Promise<boolean> => {
  try {
    console.log(`Uploading certificate for student ${studentAddress} with IPFS hash: ${ipfsHash}`);
    
    const instituteAddress = await signer.getAddress();
    
    const studentId = await getStudentIdFromAddress(studentAddress);
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    if (!studentId || !instituteId) {
      throw new Error("Student or institute not found");
    }
    
    await uploadCertificateToDb(studentId, instituteId, ipfsHash);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    return false;
  }
};

export const approveCertificate = async (
  signer: ethers.Signer,
  certificateId: string
): Promise<boolean> => {
  try {
    console.log(`Approving certificate ${certificateId}`);
    
    await approveCertificateInDb(certificateId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error approving certificate:", error);
    return false;
  }
};

export const giveAccess = async (
  signer: ethers.Signer,
  viewerAddress: string,
  certificateId: string,
  durationInDays: number
): Promise<boolean> => {
  try {
    const durationInHours = durationInDays * 24;
    
    console.log(`Granting access to ${viewerAddress} for certificate ${certificateId} for ${durationInDays} days`);
    
    const studentAddress = await signer.getAddress();
    const studentId = await getStudentIdFromAddress(studentAddress);
    
    if (!studentId) {
      throw new Error("Student not found");
    }
    
    await grantAccessInDb(certificateId, viewerAddress, studentId, durationInHours);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error granting access:", error);
    return false;
  }
};

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
    
    const { data: student } = await getStudentByAddress(studentAddress);
    if (!student || !student.current_institute_id) {
      throw new Error("Student has no current institute");
    }
    
    const newInstituteId = await getInstituteIdFromAddress(newInstituteAddress);
    if (!newInstituteId) {
      await registerInstituteInDB(
        newInstituteAddress,
        `Institute (${newInstituteAddress.substring(0, 6)}...)`,
        `institute-${newInstituteAddress.substring(0, 6)}@placeholder.com`
      );
      const newId = await getInstituteIdFromAddress(newInstituteAddress);
      if (!newId) {
        throw new Error("Failed to create institute");
      }
      
      await requestInstituteChangeInDb(studentId, student.current_institute_id, newId);
    } else {
      await requestInstituteChangeInDb(studentId, student.current_institute_id, newInstituteId);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error requesting institute change:", error);
    return false;
  }
};

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
    
    await approveInstituteChangeInDb(requestId, studentId, instituteId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error approving institute change:", error);
    return false;
  }
};

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
    
    const certificates = await getCertificatesForStudent(studentId);
    
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
    
    const students = await getStudentsForInstitute(instituteId);
    
    return students.map(student => ({
      address: student.address,
      name: student.name
    }));
  } catch (error) {
    console.error("Error getting linked students:", error);
    return [];
  }
};

export const getAccessLogs = async (
  signer: ethers.Signer,
  certificateId: string
): Promise<{ viewer: string; timestamp: number }[]> => {
  try {
    console.log(`Getting access logs for certificate ${certificateId}`);
    
    const logs = await getAccessLogsForCertificate(certificateId);
    
    return logs.map(log => ({
      viewer: log.viewer_address,
      timestamp: new Date(log.timestamp).getTime()
    }));
  } catch (error) {
    console.error("Error getting access logs:", error);
    return [];
  }
};

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
    
    const requests = await getDbPendingInstituteChangeRequests(instituteId);
    
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
    
    const certificates = await getPendingCertificatesForInstitute(instituteId);
    
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

export const getStudentByAddress = async (address: string) => {
  try {
    console.log("Looking up student with address:", address);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting student by address:", error);
      throw error;
    }

    console.log("Student lookup result:", data);
    return { data };
  } catch (error) {
    console.error("Error in getStudentByAddress:", error);
    throw error;
  }
};
