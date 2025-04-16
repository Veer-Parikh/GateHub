'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

type Role = "user" | "security" | "plumber" | "laundry"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: "user" as Role,
  })

  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      role: role as Role,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const endpoint = `http://localhost:5000/api/${formData.role}/login`

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.setItem("token", data.token)

      toast.success(`Welcome, ${formData.name}!`, {
        description: `Logged in as ${formData.role}`,
      })

      router.push(`/${formData.role}`)
    } catch (error: any) {
      toast.error("Login Failed", {
        description: error.message || "An unexpected error occurred",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors bg-white dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold text-gray-900 dark:text-white">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full" onValueChange={handleRoleChange}>
            <TabsList className="grid grid-cols-4 mb-4 w-full">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="plumber">Plumber</TabsTrigger>
              <TabsTrigger value="laundry">Laundry</TabsTrigger>
            </TabsList>

            <TabsContent value={formData.role}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button className="w-full mt-2" type="submit">
                  Login as {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Don’t have an account?{" "}
                <Link href="/signup" className="underline text-blue-600 dark:text-blue-400 hover:opacity-80">
                  Signup now
                </Link>
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
