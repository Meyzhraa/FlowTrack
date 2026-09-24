import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// Import authOptions dan PrismaClient kamu di sini
// import { authOptions } from "@/lib/auth"; 
// import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(/* authOptions */);

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, image } = await req.json();

    // Contoh update menggunakan Prisma:
    /*
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, image },
    });
    */

    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error updating profile", error }, { status: 500 });
  }
}