import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

function readPackageVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function resolveBuildId(): string {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_APP_BUILD ||
    process.env.CF_PAGES_COMMIT_SHA ||
    "";
  if (fromEnv.trim()) return fromEnv.trim().slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const APP_VERSION = readPackageVersion();
const APP_BUILD = resolveBuildId();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
    NEXT_PUBLIC_APP_BUILD: APP_BUILD,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
