
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/context/Web3Context';
import Layout from '@/components/Layout';
import { Shield, Award, Lock, Server, UserCheck, BookOpen } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isConnected } = useWeb3();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 md:py-24 px-6 hexagon-pattern">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-bg text-transparent bg-clip-text">
              Secure Certificate Validation on the Blockchain
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              E-Certify provides a decentralized platform for issuing, managing, and verifying academic credentials using blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => navigate('/student-login')} 
                className="btn-primary py-6 px-8 text-lg"
              >
                Login as Student
              </Button>
              <Button 
                onClick={() => navigate('/institute-login')} 
                className="btn-secondary py-6 px-8 text-lg"
              >
                Login as Institute
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-certify-blue/10 flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-certify-blue" />
                </div>
                <p className="text-sm font-medium">Tamper-Proof</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-certify-teal/10 flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-certify-teal" />
                </div>
                <p className="text-sm font-medium">Verifiable</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-certify-indigo/10 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-certify-indigo" />
                </div>
                <p className="text-sm font-medium">Secure</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose E-Certify?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Decentralized Storage</h3>
              <p className="text-gray-600">
                Certificates are stored on IPFS and referenced via blockchain, ensuring they can never be lost or altered.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Verification</h3>
              <p className="text-gray-600">
                Verify the authenticity of any certificate instantly without relying on third parties.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm card-hover">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
              <p className="text-gray-600">
                Students and institutions can easily manage certificates with our intuitive interface.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-4 h-full w-0.5 bg-gradient-to-b from-certify-blue via-certify-teal to-certify-indigo"></div>
              
              {/* Steps */}
              <div className="ml-12 space-y-12">
                <div className="relative">
                  <div className="absolute -left-12 w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600">
                    Create an account by connecting your MetaMask wallet and verifying your identity.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-12 w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Link to Institution or Students</h3>
                  <p className="text-gray-600">
                    Institutions and students establish secure connections for certificate issuance.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-12 w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload & Approve Certificates</h3>
                  <p className="text-gray-600">
                    Upload certificate PDFs and get them verified and stored on the blockchain.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-12 w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Share & Verify Anywhere</h3>
                  <p className="text-gray-600">
                    Share your certificates with employers or institutions for instant verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-certify-blue via-certify-teal to-certify-indigo text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the future of credential verification with blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={() => navigate('/student-login')} 
              className="bg-white text-certify-blue hover:bg-gray-100 py-6 px-8 text-lg"
            >
              Login as Student
            </Button>
            <Button 
              onClick={() => navigate('/institute-login')} 
              className="bg-white text-certify-teal hover:bg-gray-100 py-6 px-8 text-lg"
            >
              Login as Institute
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Landing;
