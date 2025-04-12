
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
    
    // Check authentication status
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      console.log("No active Supabase session, attempting to authenticate");
      
      // Use a valid email format for authentication
      const validEmail = `wallet-${instituteAddress.toLowerCase().replace('0x', '')}@certify.example.com`;
      
      try {
        // First try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: validEmail,
          password: 'password123'
        });
        
        if (signInError) {
          console.log("Sign in failed, attempting to sign up:", signInError.message);
          
          // If sign in fails, try to sign up the user
          const { error: signUpError } = await supabase.auth.signUp({
            email: validEmail,
            password: 'password123',
            options: {
              data: {
                wallet_address: instituteAddress.toLowerCase()
              }
            }
          });
          
          if (signUpError) {
            console.error("Sign up error:", signUpError);
            throw new Error(`Authentication failed: ${signUpError.message}`);
          }
          
          // Need to sign in after signing up
          const { error: postSignUpError } = await supabase.auth.signInWithPassword({
            email: validEmail,
            password: 'password123'
          });
          
          if (postSignUpError) {
            console.error("Post sign up authentication error:", postSignUpError);
            throw new Error(`Authentication failed after signup: ${postSignUpError.message}`);
          }
        }
        
        console.log("Authentication successful");
      } catch (authError: any) {
        console.error("Authentication process error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    } else {
      console.log("Found existing Supabase session");
    }
    
    // Verify we have a session before proceeding
    const { data: verifySession } = await supabase.auth.getSession();
    if (!verifySession?.session) {
      throw new Error("Failed to establish authentication session");
    }
    
    // Upload to database
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
    
    // Check authentication status
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      console.log("No active Supabase session, attempting to authenticate");
      
      // Get institute address
      const instituteAddress = await signer.getAddress();
      
      // Authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${instituteAddress.toLowerCase()}@example.com`,
        password: 'password123'
      });
      
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    }
    
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
    
    // Check authentication status
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      console.log("No active Supabase session, attempting to authenticate");
      
      // Authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${instituteAddress.toLowerCase()}@example.com`,
        password: 'password123'
      });
      
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    }
    
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
    
    // Check authentication status
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      console.log("No active Supabase session, attempting to authenticate");
      
      // Get institute address
      const instituteAddress = await signer.getAddress();
      
      // Authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${instituteAddress.toLowerCase()}@example.com`,
        password: 'password123'
      });
      
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    }
    
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
