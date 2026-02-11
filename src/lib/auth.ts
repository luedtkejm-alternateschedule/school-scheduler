import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
export type Role = "ADMIN"|"TEACHER"|"STUDENT";
const COOKIE='sched_token';
export function signToken(p:{userId:string;role:Role;email:string;name:string}){return jwt.sign(p, process.env.JWT_SECRET!, {expiresIn:'7d'});}
export function setAuthCookie(t:string){cookies().set(COOKIE,t,{httpOnly:true,sameSite:'lax',secure:true,path:'/'});}
export function clearAuthCookie(){cookies().set(COOKIE,'',{httpOnly:true,expires:new Date(0),path:'/'});}
export function getAuth(){const t=cookies().get(COOKIE)?.value; if(!t) return null; try{return jwt.verify(t, process.env.JWT_SECRET!) as any;}catch{return null;}}
