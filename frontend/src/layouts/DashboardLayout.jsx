import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getAuth, signOut } from '@/auth/auth'
import { Button } from '@/components/ui/button'

function SidebarLink({ to, children, end }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                [
                    'block rounded-md px-3 py-2 text-sm',
                    isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                ].join(' ')
            }
        >
            {children}
        </NavLink>
    )
}

export default function DashboardLayout({ title, navItems }) {
    const navigate = useNavigate()
    const auth = getAuth()

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto flex max-w-7xl">
                <aside className="hidden min-h-screen w-64 border-r p-4 md:block">
                    <div className="px-3 py-2">
                        <div className="text-sm font-semibold">ProcureEase</div>
                        <div className="text-xs text-muted-foreground">{title}</div>
                    </div>

                    <nav className="mt-4 space-y-1">
                        {navItems.map((item) => (
                            <SidebarLink key={item.to} to={item.to} end={item.end}>
                                {item.label}
                            </SidebarLink>
                        ))}
                    </nav>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex items-center justify-between border-b px-6 py-4">
                        <div className="min-w-0">
                            <div className="text-sm font-medium">{title}</div>
                            <div className="truncate text-xs text-muted-foreground">
                                Signed in as {auth?.role}{auth?.email ? ` • ${auth.email}` : ''}
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                signOut()
                                navigate('/login', { replace: true })
                            }}
                        >
                            Logout
                        </Button>
                    </header>

                    <main className="container flex-1 py-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}
