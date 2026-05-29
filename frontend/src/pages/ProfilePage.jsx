import React from 'react'
import { useNavigate } from 'react-router-dom'
import * as tokenSession from '../utils/sessionStorage'
import Profile from '../components/user/Profile'

export default function ProfilePage(){
  const navigate = useNavigate();
  const token = tokenSession.getToken();
  const userId = tokenSession.getUserId();

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6">
        <button onClick={() => navigate(-1)} className="p-2 mr-3 text-slate-600 hover:bg-slate-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="text-lg font-bold">Profile</h2>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Profile token={token} userId={userId} onClose={() => navigate(-1)} />
        </div>
      </main>
    </div>
  )
}
