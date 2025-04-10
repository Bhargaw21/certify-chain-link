
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/context/Web3Context';
import { useUser } from '@/context/UserContext';
import { registerInstitute } from '@/utils/contracts';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "@/components/ui/use-toast";
import { Wallet, Mail, Building, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { registerInstituteInDB } from '@/services/supabase';

const InstituteLogin = () => {
  const navigate = useNavigate();
  const { connectWallet, account, isConnected, signer, networkName } = useWeb3();
  const { login } = useUser();
  
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if already connected
  useEffect(() => {
    if (isConnected && account) {
      console.log("Wallet already connected, moving to step 2");
      setStep(2);
    }
  }, [isConnected, account]);
  
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Attempting to connect wallet from UI");
      await connectWallet();
      setLoading(false);
      setStep(2);
    } catch (error) {
      setLoading(false);
      console.error("Failed to connect wallet:", error);
      setError("Could not connect to your wallet. Please make sure MetaMask is installed and unlocked.");
      toast({
        title: "Connection Failed",
        description: "Could not connect to your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleVerifyEmail = () => {
    setError(null);
    if (!email) {
      setError("Please enter your institutional email address.");
      toast({
        title: "Email Required",
        description: "Please enter your institutional email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!name) {
      setError("Please enter your institution name.");
      toast({
        title: "Institute Name Required",
        description: "Please enter your institution name.",
        variant: "destructive",
      });
      return;
    }
    
    // Mock OTP verification
    setLoading(true);
    console.log("Sending verification code to:", email);
    setTimeout(() => {
      // Generate a mock OTP
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`Mock OTP sent to ${email}: ${mockOtp}`);
      
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${email}`,
      });
      
      // For demo purposes, we'll auto-fill the OTP
      setOtp(mockOtp);
      setLoading(false);
      setStep(3);
    }, 1500);
  };
  
  const handleSubmit = async () => {
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
      console.log("Starting institute registration with:", { name, email, account });
      
      // First try to register in database directly
      if (account) {
        console.log("Registering institute in database first");
        try {
          const instituteId = await registerInstituteInDB(account, name, email);
          console.log("Institute registered in database with ID:", instituteId);
        } catch (dbError) {
          console.error("Database registration error:", dbError);
          // Continue with contract registration even if DB fails
        }
      }
      
      // Register institute in the contract
      console.log("Calling registerInstitute function...");
      const success = await registerInstitute(signer, name, email);
      
      if (success) {
        console.log("Institute registration successful");
        
        // Set user context
        login('institute', name, email);
        
        toast({
          title: "Registration Successful",
          description: "Your institution has been registered successfully.",
        });
        
        // Navigate to institute dashboard
        navigate('/institute-dashboard');
      } else {
        throw new Error("Registration failed in contract call");
      }
    } catch (error: any) {
      console.error("Error registering institute:", error);
      setError(error.message || "Could not register your institution. Please try again.");
      toast({
        title: "Registration Failed",
        description: "Could not register your institution. Please try again.",
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
              <h2 className="text-2xl font-bold text-gray-900">Institute Login</h2>
              <p className="text-sm text-gray-500 mt-1">
                Register or login to manage student certificates
              </p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-certify-teal' : 'bg-gray-200'
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
                    step >= 2 ? 'bg-certify-teal' : 'bg-gray-200'
                  }`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-certify-teal' : 'bg-gray-200'
                  }`}>
                    <Building className={`w-4 h-4 ${
                      step >= 2 ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className={`ml-2 text-sm ${
                    step >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    Institute Details
                  </div>
                </div>
                <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                  <div className={`h-full ${
                    step >= 3 ? 'bg-certify-teal' : 'bg-gray-200'
                  }`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-certify-teal' : 'bg-gray-200'
                  }`}>
                    <Mail className={`w-4 h-4 ${
                      step >= 3 ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className={`ml-2 text-sm ${
                    step >= 3 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    Verify
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {networkName && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  Connected to network: <strong>{networkName}</strong>
                </p>
              </div>
            )}
            
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    Connect your institutional MetaMask wallet to continue. This wallet will be used for all certificate operations.
                  </p>
                </div>
                
                <Button
                  onClick={handleConnectWallet}
                  className="w-full py-6 bg-certify-teal hover:bg-certify-teal/90"
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
                    <Label htmlFor="name">Institute Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your institution name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Institutional Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your institutional email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleVerifyEmail}
                  className="w-full bg-certify-teal hover:bg-certify-teal/90"
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
                  onClick={handleSubmit}
                  className="w-full bg-certify-teal hover:bg-certify-teal/90"
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
                      Complete Registration
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {isConnected && account && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-xs text-gray-500">
                    Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InstituteLogin;
