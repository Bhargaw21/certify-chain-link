import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from "@/components/ui/use-toast";

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const initializeEthers = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setProvider(provider);
        setSigner(signer);
        
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
        
        const network = await provider.getNetwork();
        setChainId(network.chainId);
        
        return { provider, signer };
      } catch (error) {
        console.error("Error initializing ethers: ", error);
        return { provider: null, signer: null };
      }
    } else {
      console.log("No Ethereum browser extension detected");
      return { provider: null, signer: null };
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const network = await provider.getNetwork();
        setChainId(network.chainId);
        
        toast({
          title: "Wallet connected",
          description: `Connected to account ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        });
      } catch (error) {
        console.error("Error connecting to wallet: ", error);
        toast({
          title: "Connection failed",
          description: "Could not connect to wallet. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to use this application",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  useEffect(() => {
    initializeEthers();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
      window.ethereum.on('disconnect', () => {
        setAccount(null);
        setIsConnected(false);
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('disconnect');
      }
    };
  }, []);

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    connectWallet,
    disconnectWallet,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
