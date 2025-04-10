
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
import { Wallet, Mail, Building, ArrowRight, Loader2 } from 'lucide-react';

const InstituteLogin = () => {
  const navigate = useNavigate();
  const { connectWallet, account, isConnected, signer } = useWeb3();
  const { login } = useUser();
  
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Check if already connected
  useEffect(() => {
    if (isConnected && account) {
      setStep(2);
    }
  }, [isConnected, account]);
  
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      await connectWallet();
      setLoading(false);
      setStep(2);
    } catch (error) {
      setLoading(false);
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleVerifyEmail = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your institutional email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!name) {
      toast({
        title: "Institute Name Required",
        description: "Please enter your institution name.",
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
      
      // For demo purposes, we'll auto-fill the OTP
      setOtp(mockOtp);
      setLoading(false);
      setStep(3);
    }, 1500);
  };
  
  const handleSubmit = async () => {
    if (!otp) {
      toast({
        title: "OTP Required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }
    
    if (!signer) {
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
      
      // Register institute in the contract
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
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Error registering institute:", error);
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
