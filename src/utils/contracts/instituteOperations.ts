
import { ethers } from 'ethers';
import { getInstituteIdFromAddress, getStudentIdFromAddress } from './core';
import { 
  registerInstituteInDB, 
  getStudentsForInstitute, 
  getPendingInstituteChangeRequests as getDbPendingInstituteChangeRequests,
  approveInstituteChangeInDb
} from '@/services/supabase';

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
