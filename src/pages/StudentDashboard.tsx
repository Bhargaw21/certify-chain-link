
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/context/Web3Context';
import { useUser } from '@/context/UserContext';
import Layout from '@/components/Layout';
import FileUpload from '@/components/FileUpload';
import { uploadToIPFS } from '@/utils/ipfs';
import { getStudentCertificates, uploadCertificate } from '@/utils/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { toast } from '@/components/ui/use-toast';
import {
  FileText,
  Upload,
  UserPlus,
  Building,
  Clock,
  Shield,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  issueDate: string;
  status: 'pending' | 'approved';
  ipfsHash: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { isConnected, account, signer } = useWeb3();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('certificates');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [accessAddress, setAccessAddress] = useState('');
  const [accessDuration, setAccessDuration] = useState('24');
  const [newInstituteAddress, setNewInstituteAddress] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!isConnected || !user.isAuthenticated || user.role !== 'student') {
      navigate('/student-login');
    }
  }, [isConnected, user, navigate]);

  // Fetch certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      if (signer && account) {
        try {
          setLoading(true);
          const certificateHashes = await getStudentCertificates(signer, account);
          
          // Mock certificates data
          const mockCertificates: Certificate[] = certificateHashes.map((hash, index) => ({
            id: `cert-${index + 1}`,
            name: `Certificate ${index + 1}`,
            issueDate: new Date(Date.now() - index * 86400000 * 30).toLocaleDateString(),
            status: index % 3 === 0 ? 'pending' : 'approved',
            ipfsHash: hash,
          }));
          
          setCertificates(mockCertificates);
        } catch (error) {
          console.error("Error fetching certificates:", error);
          toast({
            title: "Error",
            description: "Failed to load certificates",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCertificates();
  }, [signer, account]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleUploadCertificate = async () => {
    if (!selectedFile || !signer) return;

    try {
      setUploadLoading(true);
      
      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(selectedFile);
      
      // Upload certificate reference to contract
      const success = await uploadCertificate(signer, account!, ipfsHash);
      
      if (success) {
        // Add certificate to list
        const newCertificate: Certificate = {
          id: `cert-${certificates.length + 1}`,
          name: selectedFile.name.replace('.pdf', ''),
          issueDate: new Date().toLocaleDateString(),
          status: 'pending',
          ipfsHash,
        };
        
        setCertificates([newCertificate, ...certificates]);
        
        toast({
          title: "Upload Successful",
          description: "Your certificate has been uploaded and is pending approval",
        });
        
        setSelectedFile(null);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading certificate:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload your certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGiveAccess = () => {
    if (!ethers.utils.isAddress(accessAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    // Mock API call
    setTimeout(() => {
      toast({
        title: "Access Granted",
        description: `Access granted to ${accessAddress.substring(0, 6)}...${accessAddress.substring(
          accessAddress.length - 4
        )} for ${accessDuration} hours`,
      });
      setAccessAddress('');
    }, 1000);
  };

  const handleChangeInstitute = () => {
    if (!ethers.utils.isAddress(newInstituteAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid institute Ethereum address",
        variant: "destructive",
      });
      return;
    }

    // Mock API call
    setTimeout(() => {
      toast({
        title: "Request Sent",
        description: "Your request to change institute has been sent for approval",
      });
      setNewInstituteAddress('');
    }, 1000);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Student Dashboard</h2>
              <p className="text-sm text-gray-500">Manage your certificates</p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('certificates')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'certificates'
                    ? 'bg-certify-blue/10 text-certify-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 mr-3" />
                My Certificates
              </button>
              
              <button
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'upload'
                    ? 'bg-certify-blue/10 text-certify-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4 mr-3" />
                Upload Certificate
              </button>
              
              <button
                onClick={() => setActiveTab('access')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'access'
                    ? 'bg-certify-blue/10 text-certify-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="w-4 h-4 mr-3" />
                Give Access
              </button>
              
              <button
                onClick={() => setActiveTab('institute')}
                className={`w-full flex items-center p-2 rounded-md text-sm ${
                  activeTab === 'institute'
                    ? 'bg-certify-blue/10 text-certify-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Building className="w-4 h-4 mr-3" />
                Change Institute
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Institute</h3>
                <p className="text-xs text-gray-500 break-all">
                  {user.instituteAddress}
                </p>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <TabsContent value="certificates" className={activeTab === 'certificates' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">My Certificates</h2>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-certify-blue animate-spin" />
                  </div>
                ) : certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certificates.map((cert) => (
                      <Card key={cert.id} className="card-hover">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{cert.name}</CardTitle>
                          <CardDescription>Issued: {cert.issueDate}</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full"
                                onClick={() => setSelectedCertificate(cert)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{selectedCertificate?.name}</DialogTitle>
                                <DialogDescription>
                                  Issued on {selectedCertificate?.issueDate}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <div className="flex items-center mb-2">
                                    <Shield className="w-4 h-4 text-certify-blue mr-2" />
                                    <span className="text-sm font-medium">Verification Status</span>
                                  </div>
                                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    selectedCertificate?.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {selectedCertificate?.status.charAt(0).toUpperCase() + selectedCertificate?.status.slice(1)}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-1">IPFS Hash</h4>
                                  <p className="text-xs text-gray-500 break-all">
                                    {selectedCertificate?.ipfsHash}
                                  </p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <div className="flex items-center mb-2">
                                    <Clock className="w-4 h-4 text-certify-blue mr-2" />
                                    <span className="text-sm font-medium">Blockchain Timestamp</span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {new Date().toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" className="flex-1 sm:flex-none" size="sm">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                                <Button className="flex-1 sm:flex-none" size="sm">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View on IPFS
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
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Certificates Yet</h3>
                    <p className="text-gray-500 mb-4">Upload your first certificate or wait for your institute to issue one</p>
                    <Button onClick={() => setActiveTab('upload')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Certificate
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="upload" className={activeTab === 'upload' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Certificate</h2>
                <p className="text-gray-500 mb-6">
                  Upload your certificate PDF file. It will be sent to your institute for verification.
                </p>
                
                <div className="space-y-6">
                  <FileUpload onFileSelected={handleFileSelected} />
                  
                  <Button 
                    onClick={handleUploadCertificate}
                    disabled={!selectedFile || uploadLoading}
                    className="w-full"
                  >
                    {uploadLoading ? (
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
            </TabsContent>
            
            <TabsContent value="access" className={activeTab === 'access' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Give Access</h2>
                <p className="text-gray-500 mb-6">
                  Grant time-limited access to your certificates for employers or other institutions.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessAddress">Ethereum Address</Label>
                    <Input
                      id="accessAddress"
                      placeholder="0x..."
                      value={accessAddress}
                      onChange={(e) => setAccessAddress(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Enter the Ethereum address of the person or institution you want to give access to
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accessDuration">Access Duration (hours)</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {[24, 48, 72, 168].map((hours) => (
                        <Button
                          key={hours}
                          type="button"
                          variant={accessDuration === hours.toString() ? "default" : "outline"}
                          onClick={() => setAccessDuration(hours.toString())}
                          className={`text-xs py-1 px-2 h-auto ${
                            accessDuration === hours.toString() ? "" : "border-dashed"
                          }`}
                        >
                          {hours} {hours === 168 ? '(1 week)' : 'h'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleGiveAccess} className="w-full mt-4">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Grant Access
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="institute" className={activeTab === 'institute' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Change Institute</h2>
                <p className="text-gray-500 mb-6">
                  Request to change your linked educational institution. This requires approval from the new institute.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Changing your institute will require approval from your new institute. All of your certificates will be transfered.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newInstituteAddress">New Institute Ethereum Address</Label>
                    <Input
                      id="newInstituteAddress"
                      placeholder="0x..."
                      value={newInstituteAddress}
                      onChange={(e) => setNewInstituteAddress(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={handleChangeInstitute} className="w-full mt-4">
                    <Building className="mr-2 h-4 w-4" />
                    Submit Request
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
