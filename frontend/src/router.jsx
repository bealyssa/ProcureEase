import { Navigate, createBrowserRouter } from 'react-router-dom'

import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/layouts/DashboardLayout'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import PendingApprovals from '@/pages/admin/PendingApprovals'
import AllRequests from '@/pages/admin/AllRequests'
import ManagePurchaseOrders from '@/pages/admin/ManagePurchaseOrders'
import AdminHistory from '@/pages/admin/History'
import AdminRequestDetails from '@/pages/admin/RequestDetails'
import AdminCreatePurchaseOrder from '@/pages/admin/CreatePurchaseOrder'

import DepartmentDashboard from '@/pages/department/DepartmentDashboard'
import CreateRequest from '@/pages/department/CreateRequest'
import MyRequests from '@/pages/department/MyRequests'
import DepartmentRequestDetails from '@/pages/department/RequestDetails'
import DepartmentPurchaseOrders from '@/pages/department/PurchaseOrders'
import DepartmentHistory from '@/pages/department/TransactionHistory'

const departmentNav = [
    { to: '/department', label: 'Dashboard', end: true },
    { to: '/department/create', label: 'Create New Request' },
    { to: '/department/requests', label: 'View My Requests' },
    { to: '/department/purchase-orders', label: 'View Purchase Orders' },
    { to: '/department/history', label: 'View Transaction History' },
]

const adminNav = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/pending-approvals', label: 'Pending Approvals List' },
    { to: '/admin/requests', label: 'View All Requests' },
    { to: '/admin/purchase-orders', label: 'Manage All Purchase Orders' },
    { to: '/admin/history', label: 'View / Archive / Delete History' },
]

export const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '/login', element: <Login /> },

    {
        element: <ProtectedRoute allowRoles={['Department User']} />,
        children: [
            {
                path: '/department',
                element: <DashboardLayout title="Department Dashboard" navItems={departmentNav} />,
                children: [
                    { index: true, element: <DepartmentDashboard /> },
                    { path: 'create', element: <CreateRequest /> },
                    { path: 'requests', element: <MyRequests /> },
                    { path: 'requests/:id', element: <DepartmentRequestDetails /> },
                    { path: 'purchase-orders', element: <DepartmentPurchaseOrders /> },
                    { path: 'history', element: <DepartmentHistory /> },
                ],
            },
        ],
    },

    {
        element: <ProtectedRoute allowRoles={['Admin']} />,
        children: [
            {
                path: '/admin',
                element: <DashboardLayout title="Admin Dashboard" navItems={adminNav} />,
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: 'pending-approvals', element: <PendingApprovals /> },
                    { path: 'requests', element: <AllRequests /> },
                    { path: 'requests/:id', element: <AdminRequestDetails /> },
                    { path: 'purchase-orders', element: <ManagePurchaseOrders /> },
                    { path: 'purchase-orders/create/:prId', element: <AdminCreatePurchaseOrder /> },
                    { path: 'history', element: <AdminHistory /> },
                ],
            },
        ],
    },

    { path: '*', element: <NotFound /> },
])
