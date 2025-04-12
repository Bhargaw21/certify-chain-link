
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { getStudentIdFromAddress, getInstituteIdFromAddress } from './core';
import { 
  registerStudentInDB, 
  getStudentCertificates as getDbStudentCertificates,
  grantAccessInDb
} from '@/services/supabase';

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
          // This will be handled by registerStudentInDB which will create a placeholder institute
          console.log("Placeholder institute will be created by registerStudentInDB");
        } catch (createInstErr) {
          console.error("Error creating placeholder institute:", createInstErr);
        }
      }
    } catch (instLookupErr) {
      console.error("Error looking up institute:", instLookupErr);
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
    
    const certificates = await getDbStudentCertificates(studentId);
    
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

// Helper functions
import { registerInstituteInDB, requestInstituteChangeInDb } from '@/services/supabase';
export { getStudentByAddress } from './core';
