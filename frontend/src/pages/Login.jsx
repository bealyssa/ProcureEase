import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '@/auth/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const ROLES = [
    { value: 'Department User', label: 'Department User' },
    { value: 'Admin', label: 'Admin' },
]

export default function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('Department User')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const isValid = useMemo(() => {
        return email.trim().length > 0 && password.trim().length > 0 && Boolean(role)
    }, [email, password, role])

    return (
        <div className="min-h-screen bg-background">
            <div className="container flex min-h-screen items-center justify-center py-10">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>
                            Choose login type based on the flowchart (Admin / Department User).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="space-y-4"
                            onSubmit={async (e) => {
                                e.preventDefault()
                                setError('')
                                setLoading(true)

                                try {
                                    const auth = await signIn({ role, email, password })
                                    navigate(auth.role === 'Admin' ? '/admin' : '/department', {
                                        replace: true,
                                    })
                                } catch (err) {
                                    setError(err?.message || 'Login failed')
                                } finally {
                                    setLoading(false)
                                }
                            }}
                        >
                            {error ? (
                                <div className="rounded-md border p-3 text-sm">
                                    <div className="font-medium">Sign in failed</div>
                                    <div className="text-muted-foreground">{error}</div>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@hospital.gov"
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Login Type</div>
                                <div className="grid gap-2">
                                    {ROLES.map((r) => (
                                        <label
                                            key={r.value}
                                            className="flex cursor-pointer items-center gap-3 rounded-md border p-3"
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={r.value}
                                                checked={role === r.value}
                                                onChange={() => setRole(r.value)}
                                                disabled={loading}
                                            />
                                            <span className="text-sm">{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full" type="submit" disabled={!isValid || loading}>
                                {loading ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
