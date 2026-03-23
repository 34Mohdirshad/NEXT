import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Zap,
  GitBranch,
  Cpu,
  ImageIcon,
  Video,
  ArrowRight,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "DAG Workflow Engine",
    description:
      "Build directed acyclic graphs with automatic parallel branch execution and circular dependency detection.",
    color: "#a855f7",
  },
  {
    icon: Cpu,
    title: "Google Gemini AI",
    description:
      "Multimodal LLM nodes supporting text, images, and custom system prompts for advanced AI pipelines.",
    color: "#ec4899",
  },
  {
    icon: ImageIcon,
    title: "Image Processing",
    description:
      "Crop, transform, and analyze images using FFmpeg-powered processing via Trigger.dev background tasks.",
    color: "#3b82f6",
  },
  {
    icon: Video,
    title: "Video Analysis",
    description:
      "Extract frames from videos at precise timestamps for multimodal AI analysis pipelines.",
    color: "#f59e0b",
  },
  {
    icon: Layers,
    title: "Node-Based Editor",
    description:
      "Intuitive drag-and-drop canvas with undo/redo, minimap, and type-safe connections between nodes.",
    color: "#22c55e",
  },
  {
    icon: Zap,
    title: "Real-time Execution",
    description:
      "Live execution monitoring with node-level status updates, glow animations, and history tracking.",
    color: "#a855f7",
  },
];

export default async function HomePage() {
  let userId: string | null = null;
  try {
     const authData = await auth();
     userId = authData.userId;
  } catch (err) {
    console.error("Clerk auth failed. Environment variables might be missing.", err);
  }

  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b"
        style={{ borderColor: "#1a1a2e" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg text-white">FlowCraft AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ color: "#8888aa" }}
          >
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary text-sm">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-16 md:py-24 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
          style={{
            background: "rgba(168, 85, 247, 0.1)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            color: "#c084fc",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full pulse-dot"
            style={{ background: "#a855f7" }}
          />
          Powered by Google Gemini + Trigger.dev
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight">
          Build{" "}
          <span className="gradient-text">AI Workflows</span>
          <br /> Visually
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
          style={{ color: "#8888aa" }}
        >
          A production-ready node-based workflow editor for chaining LLMs, image
          processing, and video analysis — with parallel DAG execution.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/sign-up" className="btn-primary text-base px-6 py-3">
            Start Building Free <ArrowRight size={16} />
          </Link>
          <Link href="/sign-in" className="btn-secondary text-base px-6 py-3">
            Sign In
          </Link>
        </div>

        {/* Canvas preview mockup */}
        <div
          className="mt-12 md:mt-16 w-full max-w-5xl rounded-2xl overflow-hidden border relative hidden sm:block"
          style={{
            borderColor: "#2d2d44",
            background: "#12121c",
            height: "380px",
          }}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, #2d2d44 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Purple gradient overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{
              background:
                "linear-gradient(to top, rgba(10,10,15,1), transparent)",
            }}
          />

          {/* Mock nodes */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-8 flex-wrap">
            {["Upload Image", "Crop Image", "LLM Analysis"].map((name, i) => (
              <div
                key={name}
                className="workflow-node fade-in"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  boxShadow:
                    i === 1
                      ? "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)"
                      : undefined,
                  borderColor: i === 1 ? "#a855f7" : undefined,
                }}
              >
                <div className="node-header">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "rgba(168, 85, 247, 0.2)" }}
                  >
                    {i === 0 ? (
                      <ImageIcon size={12} style={{ color: "#a855f7" }} />
                    ) : i === 1 ? (
                      <Layers size={12} style={{ color: "#a855f7" }} />
                    ) : (
                      <Cpu size={12} style={{ color: "#a855f7" }} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-white">{name}</span>
                </div>
                <div className="node-body">
                  <div
                    className="w-full h-2 rounded-full"
                    style={{ background: "#1a1a2e" }}
                  />
                  <div
                    className="w-3/4 h-2 rounded-full"
                    style={{ background: "#1a1a2e" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-8 py-16 md:py-20" style={{ background: "#12121c" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            Everything you need
          </h2>
          <p className="text-center mb-12" style={{ color: "#8888aa" }}>
            A complete platform for building production AI pipelines
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border transition-all duration-300 hover:border-purple-500/60"
                style={{
                  background: "#1a1a2e",
                  borderColor: "#2d2d44",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: f.color + "20" }}
                >
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-6 text-center text-sm border-t"
        style={{ color: "#555577", borderColor: "#1a1a2e" }}
      >
        © 2025 FlowCraft AI. Built with Next.js, React Flow & Google Gemini.
      </footer>
    </div>
  );
}
