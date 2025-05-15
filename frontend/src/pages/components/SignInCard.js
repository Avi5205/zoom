import * as React from "react";

export default function SignInCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <button
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          borderRadius: "4px",
          background: "#1976d2",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Sign In
      </button>
    </div>
  );
}
