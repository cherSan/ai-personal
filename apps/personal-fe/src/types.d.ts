// src/types.d.ts

declare global {
  interface Window {
    google: {
      accounts: Google.Accounts;
    };
  }
  const google: {
    accounts: Google.Accounts;
  };
}

export {};
