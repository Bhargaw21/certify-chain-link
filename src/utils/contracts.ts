
import { ethers } from 'ethers';

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

// Register a student with the smart contract
export const registerStudent = async (
  signer: ethers.Signer,
  name: string,
  email: string,
  instituteAddress: string
): Promise<boolean> => {
  try {
    console.log(`Registering student: ${name}, ${email}, to institute: ${instituteAddress}`);
    
    // In a real implementation, we would call the smart contract
    // const contract = getECertifyContract(signer);
    // const tx = await contract.registerStudent(name, email, instituteAddress);
    // await tx.wait();
    
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
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add to mock storage for demo purposes
    storeMockCertificate(studentAddress, ipfsHash);
    
    return true;
  } catch (error) {
    console.error("Error uploading certificate:", error);
    return false;
  }
};

// Approve a certificate for a student
export const approveCertificate = async (
  signer: ethers.Signer,
  studentAddress: string,
  certificateId: number
): Promise<boolean> => {
  try {
    console.log(`Approving certificate ${certificateId} for student ${studentAddress}`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update mock storage for demo purposes
    approveMockCertificate(certificateId);
    
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
  certificateId: number,
  durationInDays: number
): Promise<boolean> => {
  try {
    // Convert days to seconds for the smart contract
    const durationInSeconds = durationInDays * 24 * 60 * 60;
    
    console.log(`Granting access to ${viewerAddress} for certificate ${certificateId} for ${durationInDays} days`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add to mock access logs for demo purposes
    addMockAccessLog(certificateId, viewerAddress);
    
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
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store institute change request for demo purposes
    storeMockInstituteChangeRequest(await signer.getAddress(), newInstituteAddress);
    
    return true;
  } catch (error) {
    console.error("Error requesting institute change:", error);
    return false;
  }
};

// Approve a change of institute request
export const approveInstituteChange = async (
  signer: ethers.Signer,
  studentAddress: string
): Promise<boolean> => {
  try {
    console.log(`Approving institute change request for student ${studentAddress}`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update mock data for demo purposes
    approveMockInstituteChange(studentAddress);
    
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
): Promise<{ id: number, ipfsHash: string, approved: boolean, issuer: string, timestamp: number }[]> => {
  try {
    console.log(`Getting certificates for student ${studentAddress}`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock certificates from our in-memory storage
    return getMockCertificatesForStudent(studentAddress);
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
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock students from our in-memory storage
    return getMockStudentsForInstitute(instituteAddress);
  } catch (error) {
    console.error("Error getting linked students:", error);
    return [];
  }
};

// Get access logs for a certificate
export const getAccessLogs = async (
  signer: ethers.Signer,
  certificateId: number
): Promise<{ viewer: string; timestamp: number }[]> => {
  try {
    console.log(`Getting access logs for certificate ${certificateId}`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock access logs from our in-memory storage
    return getMockAccessLogs(certificateId);
  } catch (error) {
    console.error("Error getting access logs:", error);
    return [];
  }
};

// Get pending institute change requests
export const getPendingInstituteChangeRequests = async (
  signer: ethers.Signer
): Promise<{ studentAddress: string; studentName: string }[]> => {
  try {
    const instituteAddress = await signer.getAddress();
    console.log(`Getting pending institute change requests for institute ${instituteAddress}`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock pending requests from our in-memory storage
    return getMockPendingInstituteChangeRequests(instituteAddress);
  } catch (error) {
    console.error("Error getting pending institute change requests:", error);
    return [];
  }
};

// Get certificates pending approval for an institute
export const getPendingCertificates = async (
  signer: ethers.Signer
): Promise<{ id: number; studentAddress: string; studentName: string; ipfsHash: string; timestamp: number }[]> => {
  try {
    const instituteAddress = await signer.getAddress();
    console.log(`Getting pending certificates for institute ${instituteAddress}`);
    
    // Simulate delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock pending certificates from our in-memory storage
    return getMockPendingCertificates(instituteAddress);
  } catch (error) {
    console.error("Error getting pending certificates:", error);
    return [];
  }
};

// Mock in-memory storage for demo purposes
let mockCertificates: {
  id: number;
  ipfsHash: string;
  approved: boolean;
  issuer: string;
  timestamp: number;
  studentAddress: string;
}[] = [
  {
    id: 1,
    ipfsHash: "QmP8jTG1m9GSDJLCbeWhVSVveXsmgCzakzC6DYmi1EtZAZ",
    approved: true,
    issuer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    studentAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
  {
    id: 2,
    ipfsHash: "QmYHmUANAMGJJLGRyPzjKJUNXvRdNzGV9GX9ZMHGwvXYqt",
    approved: true,
    issuer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    studentAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
  {
    id: 3,
    ipfsHash: "QmZPWWmQWJuZE9QYEeASSWLCfnQnmVfU7rGzEzMQNqYxW4",
    approved: false,
    issuer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    studentAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
];

let mockAccessLogs: {
  certificateId: number;
  viewer: string;
  timestamp: number;
}[] = [
  { certificateId: 1, viewer: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", timestamp: Date.now() - 86400000 },
  { certificateId: 1, viewer: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", timestamp: Date.now() - 43200000 },
  { certificateId: 2, viewer: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", timestamp: Date.now() - 21600000 },
];

let mockStudents: {
  address: string;
  name: string;
  instituteAddress: string;
  pendingInstituteAddress: string | null;
}[] = [
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Alice Johnson", instituteAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", pendingInstituteAddress: null },
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", name: "Bob Smith", instituteAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", pendingInstituteAddress: null },
  { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", name: "Charlie Brown", instituteAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", pendingInstituteAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
];

// Helper functions for mock storage
function storeMockCertificate(studentAddress: string, ipfsHash: string): void {
  const newId = mockCertificates.length > 0 ? Math.max(...mockCertificates.map(c => c.id)) + 1 : 1;
  mockCertificates.push({
    id: newId,
    ipfsHash,
    approved: false,
    issuer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Default issuer for demo
    timestamp: Date.now(),
    studentAddress,
  });
}

function approveMockCertificate(certificateId: number): void {
  const certIndex = mockCertificates.findIndex(c => c.id === certificateId);
  if (certIndex !== -1) {
    mockCertificates[certIndex].approved = true;
  }
}

function addMockAccessLog(certificateId: number, viewerAddress: string): void {
  mockAccessLogs.push({
    certificateId,
    viewer: viewerAddress,
    timestamp: Date.now(),
  });
}

function storeMockInstituteChangeRequest(studentAddress: string, newInstituteAddress: string): void {
  const studentIndex = mockStudents.findIndex(s => s.address === studentAddress);
  if (studentIndex !== -1) {
    mockStudents[studentIndex].pendingInstituteAddress = newInstituteAddress;
  }
}

function approveMockInstituteChange(studentAddress: string): void {
  const studentIndex = mockStudents.findIndex(s => s.address === studentAddress);
  if (studentIndex !== -1 && mockStudents[studentIndex].pendingInstituteAddress) {
    mockStudents[studentIndex].instituteAddress = mockStudents[studentIndex].pendingInstituteAddress!;
    mockStudents[studentIndex].pendingInstituteAddress = null;
  }
}

function getMockCertificatesForStudent(studentAddress: string) {
  return mockCertificates
    .filter(cert => cert.studentAddress === studentAddress)
    .map(({ id, ipfsHash, approved, issuer, timestamp }) => ({
      id,
      ipfsHash,
      approved,
      issuer,
      timestamp,
    }));
}

function getMockStudentsForInstitute(instituteAddress: string) {
  return mockStudents
    .filter(student => student.instituteAddress === instituteAddress)
    .map(({ address, name }) => ({
      address,
      name,
    }));
}

function getMockAccessLogs(certificateId: number) {
  return mockAccessLogs
    .filter(log => log.certificateId === certificateId)
    .map(({ viewer, timestamp }) => ({
      viewer,
      timestamp,
    }));
}

function getMockPendingInstituteChangeRequests(instituteAddress: string) {
  return mockStudents
    .filter(student => student.pendingInstituteAddress === instituteAddress)
    .map(({ address, name }) => ({
      studentAddress: address,
      studentName: name,
    }));
}

function getMockPendingCertificates(instituteAddress: string) {
  const students = mockStudents.filter(s => s.instituteAddress === instituteAddress);
  const studentAddresses = students.map(s => s.address);
  
  return mockCertificates
    .filter(cert => studentAddresses.includes(cert.studentAddress) && !cert.approved)
    .map(cert => {
      const student = students.find(s => s.address === cert.studentAddress)!;
      return {
        id: cert.id,
        studentAddress: cert.studentAddress,
        studentName: student.name,
        ipfsHash: cert.ipfsHash,
        timestamp: cert.timestamp,
      };
    });
}
