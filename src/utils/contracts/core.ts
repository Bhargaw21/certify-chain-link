
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';

export const contractAddress = "0x8Bc75d6216051aBBB7C53Ec1C01E397A2bdE67a9";

export const ECertifyContractABI = [
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

export const getECertifyContract = (signer: ethers.Signer) => {
  return new ethers.Contract(contractAddress, ECertifyContractABI, signer);
};

// Utility functions to get IDs from addresses
export const getStudentIdFromAddress = async (address: string) => {
  try {
    console.log("Looking up student ID for address:", address);
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('address', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting student ID from address:", error);
      return null;
    }

    console.log("Student ID lookup result:", data?.id || null);
    return data?.id || null;
  } catch (error) {
    console.error("Error in getStudentIdFromAddress:", error);
    return null;
  }
};

export const getInstituteIdFromAddress = async (address: string) => {
  try {
    console.log("Looking up institute ID for address:", address);
    const { data, error } = await supabase
      .from('institutes')
      .select('id')
      .eq('address', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting institute ID from address:", error);
      return null;
    }

    console.log("Institute ID lookup result:", data?.id || null);
    return data?.id || null;
  } catch (error) {
    console.error("Error in getInstituteIdFromAddress:", error);
    return null;
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
