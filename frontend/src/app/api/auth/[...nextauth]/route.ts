import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export const GET = async (req: Request, props: { params: Promise<{ nextauth: string[] }> }) => {
  const syncParams = await props.params;
  return handler(req, { params: syncParams } as any);
};

export const POST = async (req: Request, props: { params: Promise<{ nextauth: string[] }> }) => {
  const syncParams = await props.params;
  return handler(req, { params: syncParams } as any);
};
