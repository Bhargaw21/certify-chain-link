
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { getStudentIdFromAddress, getInstituteIdFromAddress } from './core';
import { 
  uploadCertificateToDb, 
  approveCertificateInDb, 
  getPendingCertificatesForInstitute,
  getAccessLogsForCertificate
} from '@/services/supabase';

export const uploadCertificate = async (
  signer: ethers.Signer,
  studentAddress: string,
  ipfsHash: string
): Promise<boolean> => {
  try {
    console.log(`Uploading certificate for student ${studentAddress} with hash ${ipfsHash}`);
    
    // Get IDs
    const instituteAddress = await signer.getAddress();
    const studentId = await getStudentIdFromAddress(studentAddress);
    const instituteId = await getInstituteIdFromAddress(instituteAddress);
    
    console.log("Institute ID lookup result:", instituteId);
    
    if (!studentId) {
      throw new Error("Student not found");
    }
    
    if (!instituteId) {
      throw new Error("Institute not found");
    }
    
    // Upload to database directly without requiring authentication
    // This is a workaround for authentication issues
    try {
      const result = await uploadCertificateToDb(studentId, instituteId, ipfsHash);
      console.log("Certificate uploaded to database:", result);
    } catch (dbError) {
      console.error("Error in uploadCertificateToDb:", dbError);
      throw dbError;
    }

    // We would here normally interact with blockchain but it's simulated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    throw new Error(`Failed to upload certificate: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const approveCertificate = async (
  signer: ethers.Signer,
  certificateId: string
): Promise<boolean> => {
  try {
    console.log(`Approving certificate ${certificateId}`);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update database
    await approveCertificateInDb(certificateId);
    
    return true;
  } catch (error) {
    console.error("Error approving certificate:", error);
    return false;
  }
};

export const getPendingCertificates = async (
  signer: ethers.Signer
): Promise<{ id: string, ipfsHash: string, studentAddress: string, studentName: string }[]> => {
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
      ipfsHash: cert.ipfs_hash,
      studentAddress: cert.student?.address || "",
      studentName: cert.student?.name || ""
    }));
  } catch (error) {
    console.error("Error getting pending certificates:", error);
    return [];
  }
};

export const getAccessLogs = async (
  signer: ethers.Signer,
  certificateId: string
): Promise<{ viewerAddress: string, timestamp: number }[]> => {
  try {
    console.log(`Getting access logs for certificate ${certificateId}`);
    
    const logs = await getAccessLogsForCertificate(certificateId);
    
    return logs.map(log => ({
      viewerAddress: log.viewer_address,
      timestamp: new Date(log.timestamp).getTime()
    }));
  } catch (error) {
    console.error("Error getting access logs:", error);
    return [];
  }
};
