import { NextResponse } from "next/server";

import { deletePortalAddress, updatePortalAddress } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

function input(body:Record<string,unknown>){
  const type=typeof body.type==="string"?body.type.trim():"";
  const fullAddress=typeof body.fullAddress==="string"?body.fullAddress.trim():"";
  const landmark=typeof body.landmark==="string"?body.landmark.trim():"";
  const city=typeof body.city==="string"?body.city.trim():"";
  const pincode=typeof body.pincode==="string"?body.pincode.trim():"";
  if(!["Home","Office","Other"].includes(type)||!fullAddress||fullAddress.length>300||!city||city.length>100||!/^\d{6}$/.test(pincode))return null;
  return{type,fullAddress,landmark:landmark.slice(0,150),city,pincode,isDefault:body.isDefault===true};
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();if(!user||user.role!=="customer")return NextResponse.json({message:"Unauthorized"},{status:401});
  const value=input(await request.json() as Record<string,unknown>);if(!value)return NextResponse.json({message:"Check the address details."},{status:400});
  const address=await updatePortalAddress(user.id,(await params).id,value);
  return address?NextResponse.json({address}):NextResponse.json({message:"Address not found."},{status:404});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();if(!user||user.role!=="customer")return NextResponse.json({message:"Unauthorized"},{status:401});
  return await deletePortalAddress(user.id,(await params).id)?NextResponse.json({success:true}):NextResponse.json({message:"Address not found."},{status:404});
}
