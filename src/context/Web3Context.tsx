
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  networkName: string | null;
  networkId: number | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  isConnected: false,
  provider: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  networkName: null,
  networkId: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);

  // Check if MetaMask is installed
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      
      if (!ethereum) {
        console.log("Make sure you have MetaMask installed!");
        return;
      }
      
      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
      
      if (accounts.length !== 0) {
        const currentAccount = accounts[0];
        console.log("Found an authorized account:", currentAccount);
        setAccount(currentAccount);
        setIsConnected(true);
        
        // Setup provider and signer
        const web3Provider = new ethers.providers.Web3Provider(ethereum);
        setProvider(web3Provider);
        setSigner(web3Provider.getSigner());
        
        // Get network information
        const network = await web3Provider.getNetwork();
        setNetworkName(network.name);
        setNetworkId(network.chainId);
        console.log("Connected to network:", network.name, "with chainId:", network.chainId);

        // Sign in with Supabase using custom JWT
        await signInWithSupabase(currentAccount);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
    }
  };

  const connectWallet = async () => {
    try {
      console.log("Attempting to connect wallet...");
      const { ethereum } = window as any;
      
      if (!ethereum) {
        console.error("MetaMask is not installed");
        throw new Error("Please install MetaMask to use this feature!");
      }
      
      // Request account access
      console.log("Requesting account access...");
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      console.log("Connected to account:", accounts[0]);
      setAccount(accounts[0]);
      setIsConnected(true);
      
      // Setup provider and signer
      const web3Provider = new ethers.providers.Web3Provider(ethereum);
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
      
      // Get network information
      const network = await web3Provider.getNetwork();
      setNetworkName(network.name);
      setNetworkId(network.chainId);
      console.log("Connected to network:", network.name, "with chainId:", network.chainId);
      
      // Sign in with Supabase
      await signInWithSupabase(accounts[0]);
      
      return;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    console.log("Disconnecting wallet");
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setNetworkName(null);
    setNetworkId(null);
    
    // Sign out from Supabase
    supabase.auth.signOut();
  };
  
  // Sign in with Supabase using a custom token
  const signInWithSupabase = async (address: string) => {
    try {
      // Since we're not using actual blockchain authentication, we'll use magic link for development
      // In a production environment, you would use a proper JWT or signature-based authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${address.toLowerCase()}@example.com`,
        password: 'password123' // This is just for development
      });
      
      if (error) {
        console.log("User doesn't exist. Creating account...");
        // Create a new user if sign in fails
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${address.toLowerCase()}@example.com`,
          password: 'password123',
          options: {
            data: {
              wallet_address: address.toLowerCase()
            }
          }
        });
        
        if (signUpError) {
          throw signUpError;
        }
        
        console.log("Account created successfully:", signUpData);
        return;
      }
      
      console.log("Signed in with Supabase successfully:", data);
    } catch (error) {
      console.error("Error signing in with Supabase:", error);
    }
  };

  // Listen for changes to wallet accounts
  useEffect(() => {
    const onAccountsChanged = async (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const { ethereum } = window as any;
        if (ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(ethereum);
          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
          
          // Update network info when accounts change
          web3Provider.getNetwork().then(network => {
            setNetworkName(network.name);
            setNetworkId(network.chainId);
            console.log("Network updated:", network.name, "with chainId:", network.chainId);
          });
          
          // Sign in with Supabase
          await signInWithSupabase(accounts[0]);
        }
      } else {
        setAccount(null);
        setIsConnected(false);
        setProvider(null);
        setSigner(null);
        setNetworkName(null);
        setNetworkId(null);
        
        // Sign out from Supabase
        supabase.auth.signOut();
      }
    };
    
    const onChainChanged = (chainId: string) => {
      console.log("Network changed to chainId:", chainId);
      window.location.reload();
    };
    
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.on('accountsChanged', onAccountsChanged);
      ethereum.on('chainChanged', onChainChanged);
    }
    
    // Check if already connected
    checkIfWalletIsConnected();
    
    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', onAccountsChanged);
        ethereum.removeListener('chainChanged', onChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{
      account,
      isConnected,
      provider,
      signer,
      connectWallet,
      disconnectWallet,
      networkName,
      networkId
    }}>
      {children}
    </Web3Context.Provider>
  );
};
