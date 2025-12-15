"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function UserNav() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  if (!user) return null

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "U"

  const displayName = profile?.display_name || user.email?.split('@')[0] || "User"
  const isPro = profile?.tier === 'pro'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
            <AvatarFallback className="bg-[#EA580C] text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Pro Badge */}
          {isPro && (
            <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-2 border-white shadow-sm">
              <Crown size={10} className="text-white" strokeWidth={2.5} />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#FAFAF9] border-[#E5E5E5] shadow-lg rounded-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold leading-none text-[#1A1A1A]">{displayName}</p>
              {isPro && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full">
                  <Crown size={10} />
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs leading-none text-gray-500">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#E5E5E5]" />
        <DropdownMenuGroup>
          <Link href="/settings">
            <DropdownMenuItem className="cursor-pointer text-[#1A1A1A] hover:bg-[#F4F4F0] focus:bg-[#F4F4F0]">
              <User className="mr-2 h-4 w-4 text-[#737373]" />
              <span>账户设置</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#E5E5E5]" />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-[#1A1A1A] hover:bg-[#F4F4F0] focus:bg-[#F4F4F0]">
          <LogOut className="mr-2 h-4 w-4 text-[#737373]" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
