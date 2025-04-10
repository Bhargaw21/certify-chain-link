
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { useUser } from '@/context/UserContext';
import { registerStudent } from '@/utils/contracts';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "@/components/ui/use-toast";
import { Wallet, Mail, Building, ArrowRight, Loader2, AlertCircle, NetworkIcon, Info } from 'lucide-react';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { connectWallet, account, isConnected, signer, networkName, networkId } = useWeb3();
  const { login } = useUser();
  
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [instituteAddress, setInstituteAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset error state when changing steps
    setError(null);
  }, [step]);
  
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await connectWallet();
      console.log("Wallet connected successfully");
      setStep(2);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setError("Could not connect to your wallet. Please ensure MetaMask is installed and unlocked.");
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to your wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyEmail = () => {
    setError(null);
    
    if (!email) {
      setError("Please enter your email address.");
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!name) {
      setError("Please enter your name.");
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }
    
    // Mock OTP verification
    setLoading(true);
    setTimeout(() => {
      // Generate a mock OTP
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`Mock OTP sent to ${email}: ${mockOtp}`);
      
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${email}`,
      });
      
      // In a real app, you would send an actual email
      // For demo purposes, we'll auto-fill the OTP
      setOtp(mockOtp);
      setLoading(false);
      setStep(3);
    }, 1500);
  };
  
  const handleVerifyOtp = () => {
    setError(null);
    
    if (!otp) {
      setError("Please enter the verification code.");
      toast({
        title: "OTP Required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 1000);
  };
  
  const handleSubmit = async () => {
    setError(null);
    
    // Validate institute address
    if (!instituteAddress) {
      setError("Please enter the Ethereum address of your institute.");
      toast({
        title: "Institute Address Required",
        description: "Please enter the Ethereum address of your institute.",
        variant: "destructive",
      });
      return;
    }
    
    if (!ethers.utils.isAddress(instituteAddress)) {
      setError("Please enter a valid Ethereum address for your institute.");
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!signer) {
      setError("Wallet is not connected. Please reconnect and try again.");
      toast({
        title: "Connection Error",
        description: "Wallet is not connected. Please reconnect and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Starting student registration process...");
      console.log("Student data:", { name, email, instituteAddress });
      console.log("Wallet connected:", isConnected);
      console.log("Current network:", networkName, "with chainId:", networkId);
      
      // Register student in the contract and database
      const success = await registerStudent(signer, name, email, instituteAddress);
      
      if (success) {
        console.log("Registration successful, proceeding to login");
        // Set user context
        login('student', name, email, instituteAddress);
        
        toast({
          title: "Registration Successful",
          description: "You have been registered as a student.",
        });
        
        // Navigate to student dashboard
        navigate('/student-dashboard');
      } else {
        throw new Error("Registration failed. Please check console for details.");
      }
    } catch (error: any) {
      console.error("Error registering student:", error);
      
      // Enhanced error reporting
      let errorMessage = error.message || "Registration failed. Please try again later.";
      if (errorMessage.includes("database")) {
        errorMessage = "Failed to register student in the database. This might be due to a connection issue or invalid data. Please try again.";
      }
      
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Student Login</h2>
              <p className="text-sm text-gray-500 mt-1">
                Connect your wallet and verify your identity
              </p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-certify-blue' : 'bg-gray-200'
                  }`}>
                    <Wallet className={`w-4 h-4 ${
                      step >= 1 ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className={`ml-2 text-sm ${
                    step >= 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    Connect Wallet
                  </div>
                </div>
                <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                  <div className={`h-full ${
                    step >= 2 ? 'bg-certify-blue' : 'bg-gray-200'
                  }`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-certify-blue' : 'bg-gray-200'
                  }`}>
                    <Mail className={`w-4 h-4 ${
                      step >= 2 ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className={`ml-2 text-sm ${
                    step >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    Verify
                  </div>
                </div>
                <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                  <div className={`h-full ${
                    step >= 4 ? 'bg-certify-blue' : 'bg-gray-200'
                  }`} style={{ width: step >= 4 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 4 ? 'bg-certify-blue' : 'bg-gray-200'
                  }`}>
                    <Building className={`w-4 h-4 ${
                      step >= 4 ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className={`ml-2 text-sm ${
                    step >= 4 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    Institute
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    Connect your MetaMask wallet to continue. This will be used to sign transactions on the blockchain.
                  </p>
                </div>
                
                <Button
                  onClick={handleConnectWallet}
                  className="w-full py-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleVerifyEmail}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    placeholder="Enter the 4-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    A verification code has been sent to {email}
                  </p>
                </div>
                
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Verify & Continue
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="instituteAddress">Institute Ethereum Address</Label>
                  <Input
                    id="instituteAddress"
                    placeholder="0x..."
                    value={instituteAddress}
                    onChange={(e) => setInstituteAddress(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the Ethereum address of your educational institution
                  </p>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {isConnected && account && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-xs text-gray-500">
                      Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </p>
                  </div>
                  {networkName && (
                    <div className="flex items-center pl-4">
                      <Info className="w-3 h-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500">
                        Network: {networkName} {networkId ? `(Chain ID: ${networkId})` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentLogin;
