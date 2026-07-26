import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { JWT_COOKIE_NAME, JWT_MAX_AGE_SECONDS, signAuthToken } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body=await request.json() as Record<string,unknown>;
  const name=typeof body.name==="string"?body.name.trim():"";
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const mobile=typeof body.mobile==="string"?body.mobile.trim():"";
  const password=typeof body.password==="string"?body.password:"";
  if(name.length<2||name.length>100)return NextResponse.json({message:"Enter your name."},{status:400});
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return NextResponse.json({message:"Enter a valid email."},{status:400});
  if(!/^\d{10}$/.test(mobile))return NextResponse.json({message:"Enter a 10-digit mobile number."},{status:400});
  if(password&&password.length<8)return NextResponse.json({message:"Password must have at least 8 characters."},{status:400});
  try{
    if(password){
      await pool.query("UPDATE app_users SET name=$2,email=$3,mobile=$4,password_hash=$5,updated_at=NOW() WHERE id=$1",[user.id,name,email,mobile,await bcrypt.hash(password,12)]);
    }else{
      await pool.query("UPDATE app_users SET name=$2,email=$3,mobile=$4,updated_at=NOW() WHERE id=$1",[user.id,name,email,mobile]);
    }
    const updated={...user,name,email,mobile};
    const response=NextResponse.json({user:updated});
    response.cookies.set({name:JWT_COOKIE_NAME,value:await signAuthToken(updated),httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:JWT_MAX_AGE_SECONDS});
    return response;
  }catch(error){
    if(typeof error==="object"&&error&&"code" in error&&error.code==="23505")return NextResponse.json({message:"Email or mobile number is already in use."},{status:409});
    return NextResponse.json({message:"Unable to update profile."},{status:500});
  }
}
