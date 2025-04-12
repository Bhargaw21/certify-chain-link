
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { getInstituteIdFromAddress, getStudentIdFromAddress } from './core';
import { 
  uploadCertificateToDb, 
  approveCertificateInDb,
  getPendingCertificatesForInstitute,
  getAccessLogsForCertificate,
  registerInstituteInDB
} from '@/services/supabase';

export const uploadCertificate = async (
  signer: ethers.Signer,
  studentAddress: string,
  ipfsHash: string
): Promise<boolean> => {
  try {
    console.log(`Uploading certificate for student ${studentAddress} with IPFS hash: ${ipfsHash}`);
    
    const instituteAddress = await signer.getAddress();
    console.log("Institute address:", instituteAddress);
    
    // Check if student exists - with better error handling
    console.log("Looking up student with address:", studentAddress);
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('address', studentAddress.toLowerCase())
      .single();
    
    if (studentError) {
      console.error("Error finding student:", studentError);
      
      // Auto-register the student with placeholder details
      console.log("Student not found. Creating placeholder student...");
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          address: studentAddress.toLowerCase(),
          name: `Student (${studentAddress.substring(0, 6)}...)`,
          email: `student-${studentAddress.substring(0, 6)}@placeholder.com`,
          current_institute_id: null
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating student:", createError);
        throw new Error("Failed to create student profile");
      }
      
      console.log("Created placeholder student:", newStudent);
      var studentId = newStudent.id;
    } else {
      console.log("Found student:", studentData);
      var studentId = studentData.id;
    }
    
    // Check if institute exists - with better error handling
    console.log("Looking up institute with address:", instituteAddress);
    const { data: instituteData, error: instituteError } = await supabase
      .from('institutes')
      .select('id')
      .eq('address', instituteAddress.toLowerCase())
      .single();
    
    if (instituteError) {
      console.error("Error finding institute:", instituteError);
      
      // Auto-register the institute with placeholder details
      console.log("Institute not found. Creating placeholder institute...");
      const { data: newInstitute, error: createError } = await supabase
        .from('institutes')
        .insert({
          address: instituteAddress.toLowerCase(),
          name: `Institute (${instituteAddress.substring(0, 6)}...)`,
          email: `institute-${instituteAddress.substring(0, 6)}@placeholder.com`
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating institute:", createError);
        throw new Error("Failed to create institute profile");
      }
      
      console.log("Created placeholder institute:", newInstitute);
      var instituteId = newInstitute.id;
    } else {
      console.log("Found institute:", instituteData);
      var instituteId = instituteData.id;
    }
    
    // Now link the student to this institute if not already linked
    if (studentId) {
      const { data: studentDetails } = await supabase
        .from('students')
        .select('current_institute_id')
        .eq('id', studentId)
        .single();
      
      if (!studentDetails?.current_institute_id && instituteId) {
        console.log("Linking student to institute...");
        await supabase
          .from('students')
          .update({ current_institute_id: instituteId })
          .eq('id', studentId);
      }
    }
    
    // Upload the certificate
    console.log("Uploading certificate to database with studentId:", studentId, "and instituteId:", instituteId);
    if (!studentId || !instituteId) {
      throw new Error("Failed to determine student or institute ID");
    }
    
    const { data: certData, error: certError } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        institute_id: instituteId,
        ipfs_hash: ipfsHash,
        is_approved: false
      })
      .select()
      .single();
    
    if (certError) {
      console.error("Error uploading certificate to database:", certError);
      throw new Error(`Failed to upload certificate: ${certError.message}`);
    }
    
    console.log("Certificate uploaded successfully:", certData);
    return true;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    throw error;
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
