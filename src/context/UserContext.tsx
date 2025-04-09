
import React, { createContext, useContext, useState } from 'react';
import { useWeb3 } from './Web3Context';

type UserRole = 'student' | 'institute' | null;

interface UserState {
  role: UserRole;
  name: string;
  email: string;
  isAuthenticated: boolean;
  instituteAddress?: string;
}

interface UserContextType {
  user: UserState;
  login: (role: UserRole, name: string, email: string, instituteAddress?: string) => void;
  logout: () => void;
}

const initialUserState: UserState = {
  role: null,
  name: '',
  email: '',
  isAuthenticated: false,
  instituteAddress: '',
};

const UserContext = createContext<UserContextType>({
  user: initialUserState,
  login: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(initialUserState);
  const { disconnectWallet } = useWeb3();

  const login = (role: UserRole, name: string, email: string, instituteAddress?: string) => {
    setUser({
      role,
      name,
      email,
      isAuthenticated: true,
      instituteAddress,
    });
  };

  const logout = () => {
    setUser(initialUserState);
    disconnectWallet();
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
