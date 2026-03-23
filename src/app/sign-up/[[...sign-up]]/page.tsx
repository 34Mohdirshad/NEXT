import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0a0a0f" }}
    >
      <SignUp
        appearance={{
          variables: {
            colorBackground: "#12121c",
            colorInputBackground: "#1a1a2e",
            colorInputText: "#f0f0ff",
            colorText: "#f0f0ff",
            colorTextSecondary: "#8888aa",
            colorPrimary: "#a855f7",
            borderRadius: "10px",
          },
          elements: {
            card: "border border-[#2d2d44] shadow-2xl",
            formButtonPrimary:
              "bg-gradient-to-r from-purple-700 to-purple-500 hover:opacity-90",
          },
        }}
      />
    </div>
  );
}
