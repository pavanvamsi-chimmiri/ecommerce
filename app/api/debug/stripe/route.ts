import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET);
  const whichKey = process.env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY" : (process.env.STRIPE_SECRET ? "STRIPE_SECRET" : null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || null;
  return NextResponse.json({ hasKey, whichKey, appUrl });
}


