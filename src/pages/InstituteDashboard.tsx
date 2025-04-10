import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/context/Web3Context';
import { useUser } from '@/context/UserContext';
import Layout from '@/components/Layout';
import FileUpload from '@/components/FileUpload';
import { uploadToIPFS, viewIPFS, downloadFromIPFS } from '@/utils/ipfs';
import { 
  getLinkedStudents, 
  getAccessLogs, 
  uploadCertificate, 
  approveCertificate,
  approveInstituteChange 
} from '@/utils/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Users,
  FileText,
  Upload,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  User,
  Clock,
  Search,
  Calendar,
  FileCheck,
  Loader2,
  Download,
  ExternalLink,
} from 'lucide-react';

interface Student {
  id: string;
  address: string;
  name: string;
  email: string;
  pendingCertificates: number;
}

interface Certificate {
  id: string;
  studentName: string;
  studentAddress: string;
  name: string;
  uploadDate: string;
  status: 'pending' | 'approved';
  ipfsHash: string;
}

interface AccessLog {
  id: string;
  studentName: string;
  viewerAddress: string;
  timestamp: number;
  certificateName: string;
}

interface ChangeRequest {
  id: string;
  studentName: string;
  studentAddress: string;
  newInstituteAddress: string;
  requestDate: string;
}

const InstituteDashboard = () => {
  const navigate = useNavigate();
  const { isConnected, account, signer } = useWeb3();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [certificateName, setCertificateName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [certificatesTabValue, setCertificatesTabValue] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !user.isAuthenticated || user.role !== 'institute') {
      navigate('/institute-login');
    }
  }, [isConnected, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (signer) {
        try {
          setLoading(true);
          
          const studentsData = await getLinkedStudents(signer);
          const mockStudents: Student[] = studentsData.map((student, index) => ({
            id: `student-${index + 1}`,
            address: student.address,
            name: student.name,
            email: `${student.name.toLowerCase().replace(' ', '.')}@gmail.com`,
            pendingCertificates: Math.floor(Math.random() * 3),
          }));
          
          setStudents(mockStudents);
          
          const mockCertificates: Certificate[] = Array(8).fill(null).map((_, index) => ({
            id: `cert-${index + 1}`,
            studentName: mockStudents[index % mockStudents.length].name,
            studentAddress: mockStudents[index % mockStudents.length].address,
            name: `Certificate of ${index % 2 === 0 ? 'Achievement' : 'Completion'} - ${index + 1}`,
            uploadDate: new Date(Date.now() - index * 86400000 * 15).toLocaleDateString(),
            status: index % 3 === 0 ? 'pending' : 'approved',
            ipfsHash: `QmP8jTG1m9GSDJLCbeWhVSVveXsmgCzakzC6DYmi1EtZA${index}`,
          }));
          
          setCertificates(mockCertificates);
          
          const logsData = await getAccessLogs(signer, 1);
          const mockAccessLogs: AccessLog[] = logsData.map((log, index) => ({
            id: `log-${index + 1}`,
            studentName: mockStudents[index % mockStudents.length].name,
            viewerAddress: log.viewer,
            timestamp: log.timestamp,
            certificateName: mockCertificates[index % mockCertificates.length].name,
          }));
          
          setAccessLogs(mockAccessLogs);
          
          const mockChangeRequests: ChangeRequest[] = Array(2).fill(null).map((_, index) => ({
            id: `request-${index + 1}`,
            studentName: mockStudents[index].name,
            studentAddress: mockStudents[index].address,
            newInstituteAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
            requestDate: new Date(Date.now() - index * 86400000 * 2).toLocaleDateString(),
          }));
          
          setChangeRequests(mockChangeRequests);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({
            title: "Error",
            description: "Failed to load data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [signer]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleViewOnIPFS = (cert: Certificate) => {
    setViewLoading(true);
    try {
      viewIPFS(cert.ipfsHash);
      toast({
        title: "Opening Certificate",
        description: "The certificate is opening in a new tab",
      });
    } catch (error) {
      console.error("Error viewing certificate:", error);
      toast({
        title: "Error",
        description: "Failed to open the certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setViewLoading(false);
    }
  };

  const handleDownloadCertificate = async (cert: Certificate) => {
    setDownloadLoading(true);
    try {
      const filename = `${cert.name}.pdf`;
      await downloadFromIPFS(cert.ipfsHash, filename);
      
      toast({
        title: "Download Started",
        description: "Your certificate is being downloaded",
      });
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleUploadCertificate = async () => {
    if (!selectedFile || !selectedStudent || !signer) {
      toast({
        title: "Missing Information",
        description: "Please select a student and upload a file",
        variant: "destructive",
      });
      return;
    }

    if (!certificateName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a certificate name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const ipfsHash = await uploadToIPFS(selectedFile);
      
      const success = await uploadCertificate(signer, selectedStudent.address, ipfsHash);
      
      if (success) {
        const newCertificate: Certificate = {
          id: `cert-${certificates.length + 1}`,
          studentName: selectedStudent.name,
          studentAddress: selectedStudent.address,
          name: certificateName,
          uploadDate: new Date().toLocaleDateString(),
          status: 'approved',
          ipfsHash,
        };
        
        setCertificates([newCertificate, ...certificates]);
        
        toast({
          title: "Upload Successful",
          description: `Certificate uploaded for ${selectedStudent.name}`,
        });
        
        setSelectedFile(null);
        setCertificateName('');
        setSelectedStudent(null);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading certificate:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCertificate = async (cert: Certificate) => {
    if (!signer) return;

    try {
      setLoading(true);
      
      const certificateId = parseInt(cert.id.split('-')[1]);
      
      const success = await approveCertificate(signer, cert.studentAddress, certificateId);
      
      if (success) {
        setCertificates(certificates.map(c => 
          c.id === cert.id ? { ...c, status: 'approved' } : c
        ));
        
        toast({
          title: "Certificate Approved",
          description: "The certificate has been verified and approved",
        });
      } else {
        throw new Error("Approval failed");
      }
    } catch (error) {
      console.error("Error approving certificate:", error);
      toast({
        title: "Error",
        description: "Failed to approve certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveChangeRequest = async (request: ChangeRequest) => {
    if (!signer) return;

    try {
      setLoading(true);
      
      const success = await approveInstituteChange(signer, request.studentAddress);
      
      if (success) {
        setChangeRequests(changeRequests.filter(req => req.id !== request.id));
        
        toast({
          title: "Request Approved",
          description: "The institute change request has been approved",
        });
      } else {
        throw new Error("Approval failed");
      }
    } catch (error) {
      console.error("Error approving change request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToStudentDashboard = () => {
    navigate('/student-dashboard');
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCertificates = certificates.filter(cert => {
    if (certificatesTabValue === 'all') return true;
    if (certificatesTabValue === 'pending') return cert.status === 'pending';
    if (certificatesTabValue === 'approved') return cert.status === 'approved';
    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Linked Students</h2>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <CardDescription>{student.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500 mb-2 break-all">
                        {student.address}
                      </p>
                      {student.pendingCertificates > 0 && (
                        <div className="flex items-center mt-2">
                          <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">
                            {student.pendingCertificates} Pending Certificate(s)
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{student.name}</DialogTitle>
                            <DialogDescription>
                              Student Details and Certificates
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-certify-teal/10 flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-certify-teal" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">{student.name}</h4>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-md">
                              <h4 className="text-sm font-medium mb-1">Ethereum Address</h4>
                              <p className="text-xs text-gray-500 break-all">
                                {student.address}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Certificates</h4>
                              <div className="space-y-2">
                                {certificates
                                  .filter(cert => cert.studentAddress === student.address)
                                  .map(cert => (
                                    <div key={cert.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                      <div>
                                        <p className="text-sm font-medium">{cert.name}</p>
                                        <p className="text-xs text-gray-500">{cert.uploadDate}</p>
                                      </div>
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        cert.status === 'approved' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                                      </div>
                                    </div>
                                  ))}
                                {certificates.filter(cert => cert.studentAddress === student.address).length === 0 && (
                                  <p className="text-sm text-gray-500 text-center py-2">No certificates found</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student);
                                setActiveTab('upload');
                              }}
                            >
                              Upload Certificate
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Found</h3>
                <p className="text-gray-500 mb-4">No students are currently linked to your institution</p>
              </div>
            )}
          </div>
        );
        
      case 'certificates':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Certificates</h2>
              <Tabs value={certificatesTabValue} onValueChange={setCertificatesTabValue}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
              </div>
            ) : filteredCertificates.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCertificates.map((cert) => (
                  <Card key={cert.id} className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                      <CardDescription>Uploaded: {cert.uploadDate}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-2">
                        <User className="w-4 h-4 text-certify-teal mr-2" />
                        <span className="text-sm">{cert.studentName}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          cert.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        IPFS: {cert.ipfsHash}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {cert.status === 'pending' ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleApproveCertificate(cert)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Approve Certificate
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(`https://ipfs.io/ipfs/${cert.ipfsHash}`, '_blank')}
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          View Certificate
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Certificates Yet</h3>
                <p className="text-gray-500 mb-4">Start by uploading certificates for your students</p>
                <Button onClick={() => setActiveTab('upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Certificate
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'upload':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Certificate</h2>
            <p className="text-gray-500 mb-6">
              Issue a new certificate to one of your students.
            </p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="student">Select Student</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {students.map((student) => (
                    <Button
                      key={student.id}
                      type="button"
                      variant={selectedStudent?.id === student.id ? "default" : "outline"}
                      onClick={() => setSelectedStudent(student)}
                      className={`justify-start text-left h-auto py-3 ${
                        selectedStudent?.id === student.id ? "" : "border-dashed"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-certify-teal/10 flex items-center justify-center mr-2">
                        <User className="w-4 h-4 text-certify-teal" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.address.substring(0, 6)}...{student.address.substring(student.address.length - 4)}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="certificateName">Certificate Name</Label>
                <Input
                  id="certificateName"
                  placeholder="Enter certificate name"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                />
              </div>
              
              <FileUpload onFileSelected={handleFileSelected} />
              
              <Button 
                onClick={handleUploadCertificate}
                disabled={!selectedFile || !selectedStudent || !certificateName || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Certificate
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      case 'logs':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Certificate Access Logs</h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
              </div>
            ) : accessLogs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {accessLogs.map((log) => (
                  <div key={log.id} className="py-4">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Certificate accessed for {log.studentName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.certificateName}
                        </p>
                        <div className="flex items-center mt-2">
                          <p className="text-xs text-gray-500">
                            Viewer: {log.viewerAddress.substring(0, 6)}...{log.viewerAddress.substring(log.viewerAddress.length - 4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Access Logs</h3>
                <p className="text-gray-500">
                  When students share their certificates, access logs will appear here
                </p>
              </div>
            )}
          </div>
        );
        
      case 'requests':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Institute Change Requests</h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
              </div>
            ) : changeRequests.length > 0 ? (
              <div className="space-y-4">
                {changeRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Change Request</CardTitle>
                        <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">
                          Pending Approval
                        </div>
                      </div>
                      <CardDescription>Requested: {request.requestDate}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-certify-teal mr-2" />
                          <span className="text-sm font-medium">{request.studentName}</span>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="text-xs font-medium mb-1">Student Address</h4>
                          <p className="text-xs text-gray-500 break-all">
                            {request.studentAddress}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="text-xs font-medium mb-1">New Institute Address</h4>
                          <p className="text-xs text-gray-500 break-all">
                            {request.newInstituteAddress}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        Decline
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApproveChangeRequest(request)}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Approve Request</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Pending Requests</h3>
                <p className="text-gray-500">
                  When students request to change their institute, they will appear here
                </p>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Institute Dashboard</h2>
              <p className="text-sm text-gray-500">Manage students and certificates</p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('students')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'students'
                    ? 'bg-certify-teal/10 text-certify-teal font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 mr-3" />
                Linked Students
              </button>
              
              <button
                onClick={() => setActiveTab('certificates')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'certificates'
                    ? 'bg-certify-teal/10 text-certify-teal font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 mr-3" />
                Certificates
              </button>
              
              <button
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'upload'
                    ? 'bg-certify-teal/10 text-certify-teal font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4 mr-3" />
                Upload Certificate
              </button>
              
              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'logs'
                    ? 'bg-certify-teal/10 text-certify-teal font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ClipboardList className="w-4 h-4 mr-3" />
                Access Logs
              </button>
              
              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'requests'
                    ? 'bg-certify-teal/10 text-certify-teal font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 mr-3" />
                Change Requests
                {changeRequests.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {changeRequests.length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Connected Address</h3>
                <p className="text-xs text-gray-500 break-all">
                  {account}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={goToStudentDashboard}
              >
                <User className="w-4 h-4 mr-2" />
                Switch to Student View
              </Button>
            </div>
          </div>
          
          <div className="flex-1">
            {activeTab === 'students' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Linked Students</h2>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                      <Card key={student.id} className="card-hover">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <CardDescription>{student.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-gray-500 mb-2 break-all">
                            {student.address}
                          </p>
                          {student.pendingCertificates > 0 && (
                            <div className="flex items-center mt-2">
                              <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">
                                {student.pendingCertificates} Pending Certificate(s)
                              </div>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{student.name}</DialogTitle>
                                <DialogDescription>
                                  Student Details and Certificates
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-certify-teal/10 flex items-center justify-center mr-3">
                                    <User className="w-5 h-5 text-certify-teal" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">{student.name}</h4>
                                    <p className="text-xs text-gray-500">{student.email}</p>
                                  </div>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <h4 className="text-sm font-medium mb-1">Ethereum Address</h4>
                                  <p className="text-xs text-gray-500 break-all">
                                    {student.address}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Certificates</h4>
                                  <div className="space-y-2">
                                    {certificates
                                      .filter(cert => cert.studentAddress === student.address)
                                      .map(cert => (
                                        <div key={cert.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                          <div>
                                            <p className="text-sm font-medium">{cert.name}</p>
                                            <p className="text-xs text-gray-500">{cert.uploadDate}</p>
                                          </div>
                                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                                            cert.status === 'approved' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                                          </div>
                                        </div>
                                      ))}
                                    {certificates.filter(cert => cert.studentAddress === student.address).length === 0 && (
                                      <p className="text-sm text-gray-500 text-center py-2">No certificates found</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setActiveTab('upload');
                                  }}
                                >
                                  Upload Certificate
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Found</h3>
                    <p className="text-gray-500 mb-4">No students are currently linked to your institution</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'certificates' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Certificates</h2>
                  <Tabs value={certificatesTabValue} onValueChange={setCertificatesTabValue}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="approved">Approved</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
                  </div>
                ) : filteredCertificates.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredCertificates.map((cert) => (
                      <Card key={cert.id} className="card-hover">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{cert.name}</CardTitle>
                          <CardDescription>Uploaded: {cert.uploadDate}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center mb-2">
                            <User className="w-4 h-4 text-certify-teal mr-2" />
                            <span className="text-sm">{cert.studentName}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              cert.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            IPFS: {cert.ipfsHash}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2">
                          {cert.status === 'pending' ? (
                            <Button 
                              className="flex-1"
                              onClick={() => handleApproveCertificate(cert)}
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="w-4 h-4 mr-2" />
                                  Approve Certificate
                                </>
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleViewOnIPFS(cert)}
                                disabled={viewLoading}
                              >
                                {viewLoading ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                )}
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleDownloadCertificate(cert)}
                                disabled={downloadLoading}
                              >
                                {downloadLoading ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-2" />
                                )}
                                Download
                              </Button>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Certificates Yet</h3>
                    <p className="text-gray-500 mb-4">Start by uploading certificates for your students</p>
                    <Button onClick={() => setActiveTab('upload')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Certificate
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'upload' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Certificate</h2>
                <p className="text-gray-500 mb-6">
                  Issue a new certificate to one of your students.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="student">Select Student</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {students.map((student) => (
                        <Button
                          key={student.id}
                          type="button"
                          variant={selectedStudent?.id === student.id ? "default" : "outline"}
                          onClick={() => setSelectedStudent(student)}
                          className={`justify-start text-left h-auto py-3 ${
                            selectedStudent?.id === student.id ? "" : "border-dashed"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-certify-teal/10 flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-certify-teal" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.address.substring(0, 6)}...{student.address.substring(student.address.length - 4)}
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="certificateName">Certificate Name</Label>
                    <Input
                      id="certificateName"
                      placeholder="Enter certificate name"
                      value={certificateName}
                      onChange={(e) => setCertificateName(e.target.value)}
                    />
                  </div>
                  
                  <FileUpload onFileSelected={handleFileSelected} />
                  
                  <Button 
                    onClick={handleUploadCertificate}
                    disabled={!selectedFile || !selectedStudent || !certificateName || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Certificate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Certificate Access Logs</h2>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
                  </div>
                ) : accessLogs.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {accessLogs.map((log) => (
                      <div key={log.id} className="py-4">
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <Clock className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                Certificate accessed for {log.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.certificateName}
                            </p>
                            <div className="flex items-center mt-2">
                              <p className="text-xs text-gray-500">
                                Viewer: {log.viewerAddress.substring(0, 6)}...{log.viewerAddress.substring(log.viewerAddress.length - 4)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <ClipboardList className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Access Logs</h3>
                    <p className="text-gray-500">
                      When students share their certificates, access logs will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'requests' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Institute Change Requests</h2>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-certify-teal animate-spin" />
                  </div>
                ) : changeRequests.length > 0 ? (
                  <div className="space-y-4">
                    {changeRequests.map((request) => (
                      <Card key={request.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Change Request</CardTitle>
                            <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">
                              Pending Approval
                            </div>
                          </div>
                          <CardDescription>Requested: {request.requestDate}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-certify-teal mr-2" />
                              <span className="text-sm font-medium">{request.studentName}</span>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-md">
                              <h4 className="text-xs font-medium mb-1">Student Address</h4>
                              <p className="text-xs text-gray-500 break-all">
                                {request.studentAddress}
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-md">
                              <h4 className="text-xs font-medium mb-1">New Institute Address</h4>
                              <p className="text-xs text-gray-500 break-all">
                                {request.newInstituteAddress}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" size="sm">
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveChangeRequest(request)}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>Approve Request</>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Pending Requests</h3>
                    <p className="text-gray-500">
                      When students request to change their institute, they will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InstituteDashboard;
