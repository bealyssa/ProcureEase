import { Navigate, Outlet } from 'react-router-dom'
import { getRole, isSignedIn } from '@/auth/auth'

export default function ProtectedRoute({ allowRoles }) {
    if (!isSignedIn()) {
        return <Navigate to="/login" replace />
    }

    const role = getRole()
    if (allowRoles && !allowRoles.includes(role)) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
