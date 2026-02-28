import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Slate API",
    version: "0.1.0",
    endpoints: ["/api", "/api/health", "/api/example", "/api/profile", "/api/class-scenario", "/api/personas", "/api/flow"],
  });
}
