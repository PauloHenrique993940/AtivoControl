import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { api } from '../services/api'
export interface User { id:string; name:string; email:string; role:string; active:boolean; preferences:Record<string,boolean> }
interface AuthContextType { isAuthenticated:boolean; ready:boolean; user:User|null; login:(token:string,user:User)=>void; logout:()=>void; updateUser:(user:User)=>void }
const AuthContext = createContext<AuthContextType|undefined>(undefined)
export const AuthProvider = ({children}:{children:ReactNode}) => {
const [user,setUser]=useState<User|null>(null);const [ready,setReady]=useState(false)
const clear=useCallback(()=>{localStorage.removeItem('token');localStorage.removeItem('user');setUser(null);setReady(true)},[])
const updateUser=(value:User)=>{setUser(value);localStorage.setItem('user',JSON.stringify(value))}
const login=(token:string,value:User)=>{localStorage.setItem('token',token);updateUser(value);setReady(true)}
const logout=()=>{const token=localStorage.getItem('token');void api.post('/auth/logout',{}, {headers:{Authorization:'Bearer '+token}}).catch(()=>{});clear()}
useEffect(()=>{let live=true;window.addEventListener('session:expired',clear);if(localStorage.getItem('token'))api.get<User>('/auth/me').then(r=>{if(live){setUser(r.data);localStorage.setItem('user',JSON.stringify(r.data))}}).catch(()=>{if(live)clear()}).finally(()=>{if(live)setReady(true)});else setReady(true);return()=>{live=false;window.removeEventListener('session:expired',clear)}},[clear])
return <AuthContext.Provider value={{isAuthenticated:Boolean(user),ready,user,login,logout,updateUser}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>{const context=useContext(AuthContext);if(!context)throw Error('AuthProvider ausente');return context}
