"use client";

import React, { createContext, useContext } from "react";

const AuthContext = createContext<any>(null);

export const MockClerkProvider = ({ children }: { children: React.ReactNode }) => {
  const mockValue = {
    user: {
      id: "debfc4b5-45eb-45dc-90d3-30a83d4e1064",
      fullName: "Igor Massaro (Debug)",
      primaryEmailAddress: { emailAddress: "igorpminacio@hotmail.com" },
      publicMetadata: { currency: "BRL" },
    },
    isSignedIn: true,
    isLoaded: true,
    userId: "debfc4b5-45eb-45dc-90d3-30a83d4e1064",
    getToken: async () => "mock-token",
  };

  return <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>;
};

// This will be used to swap imports or via a helper
export const useUser = () => {
  try {
    // Attempt to use real Clerk if available
    const clerk = require("@clerk/nextjs");
    return clerk.useUser();
  } catch {
    return {
      isSignedIn: true,
      user: { id: "debfc4b5-45eb-45dc-90d3-30a83d4e1064", publicMetadata: { currency: "BRL" } },
      isLoaded: true,
    };
  }
};