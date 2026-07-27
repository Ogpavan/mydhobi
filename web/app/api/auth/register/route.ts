import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { JWT_COOKIE_NAME, JWT_MAX_AGE_SECONDS, signAuthToken } from "@/lib/auth";
import { ensureCustomerTable } from "@/lib/customers";
import { pool } from "@/lib/db";
import { ensureReferralSchema } from "@/lib/referrals";

export async function POST(request: Request) {
  const body=await request.json() as Record<string,unknown>;
  const name=typeof body.name==="string"?body.name.trim().replace(/\s+/g," "):"";
  const mobile=typeof body.mobile==="string"?body.mobile.trim():"";
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const password=typeof body.password==="string"?body.password:"";
  const referralCode=typeof body.referralCode==="string"?body.referralCode.trim().toUpperCase():"";
  if(name.length<2||name.length>100)return NextResponse.json({message:"Enter your name."},{status:400});
  if(!/^\d{10}$/.test(mobile))return NextResponse.json({message:"Enter a 10-digit mobile number."},{status:400});
  if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return NextResponse.json({message:"Enter a valid email."},{status:400});
  if(password.length<8)return NextResponse.json({message:"Password must have at least 8 characters."},{status:400});
  await Promise.all([ensureCustomerTable(),ensureReferralSchema()]);
  let referrerId:string|null=null;
  if(referralCode){
    const owner=await pool.query("SELECT user_id FROM customer_referral_profiles WHERE UPPER(code)=UPPER($1)",[referralCode]);
    if(!owner.rows[0])return NextResponse.json({message:"Referral code not found."},{status:400});
    referrerId=String(owner.rows[0].user_id);
  }
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const userResult=await client.query(
      `INSERT INTO app_users(email,mobile,password_hash,name,designation,role,status)
       VALUES($1,$2,$3,$4,'Customer','customer','active')
       RETURNING id,email,mobile,name,designation,role`,
      [email||`customer.${mobile}@mydhobi.local`,mobile,await bcrypt.hash(password,12),name],
    );
    const row=userResult.rows[0];
    await client.query(
      `INSERT INTO customers
       (full_name,mobile,whatsapp,house_flat_no,street_area,city,pincode,rate_card,user_id)
       VALUES($1,$2,$2,'Address not added','Address not added','Not added','000000','Standard',$3)`,
      [name,mobile,row.id],
    );
    if(referrerId){
      await client.query(
        `INSERT INTO customer_referrals(referrer_id,referred_user_id,code)
         VALUES($1,$2,$3)`,
        [referrerId,row.id,referralCode],
      );
    }
    await client.query("COMMIT");
    const user={id:String(row.id),email:String(row.email),mobile:String(row.mobile),name:String(row.name),designation:String(row.designation),role:"customer" as const};
    const response=NextResponse.json({user},{status:201});
    response.cookies.set({name:JWT_COOKIE_NAME,value:await signAuthToken(user),httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:JWT_MAX_AGE_SECONDS});
    return response;
  }catch(error){
    await client.query("ROLLBACK");
    if(typeof error==="object"&&error&&"code" in error&&error.code==="23505")return NextResponse.json({message:"An account already uses this mobile or email."},{status:409});
    console.error("Customer registration failed",error);
    return NextResponse.json({message:"Unable to create account."},{status:500});
  }finally{client.release();}
}
