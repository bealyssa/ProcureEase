import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate, formatMoney } from '@/mock/format'
import { apiFetch } from '@/lib/api'
import ConfirmActionDialog from '@/components/ConfirmActionDialog'

function statusVariant(status) {
    if (status === 'Approved') return 'default'
    if (status === 'Rejected') return 'outline'
    return 'secondary'
}

export default function History() {
    const [deptRows, setDeptRows] = useState([])
    const [deptName, setDeptName] = useState('')
    const [deptError, setDeptError] = useState('')
    const [deptLoading, setDeptLoading] = useState(false)

    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [userRole, setUserRole] = useState('Department User')
    const [userPassword, setUserPassword] = useState('')
    const [userDeptId, setUserDeptId] = useState('')
    const [userError, setUserError] = useState('')
    const [userLoading, setUserLoading] = useState(false)

    const [requests, setRequests] = useState([])
    const [pos, setPos] = useState([])
    const [audit, setAudit] = useState([])
    const [dataLoading, setDataLoading] = useState(true)
    const [dataError, setDataError] = useState('')

    const activeRequests = useMemo(() => requests.filter((r) => !r?.deleted), [requests])
    const deletedRequests = useMemo(() => requests.filter((r) => r?.deleted), [requests])
    const activePos = useMemo(() => pos.filter((p) => !p?.deleted), [pos])
    const deletedPos = useMemo(() => pos.filter((p) => p?.deleted), [pos])

    const loadRecords = useCallback(async function loadRecords() {
        try {
            setDataLoading(true)
            setDataError('')
            const [prs, purchaseOrders, logs] = await Promise.all([
                apiFetch('/api/purchase-requests?includeDeleted=true'),
                apiFetch('/api/purchase-orders?includeDeleted=true'),
                apiFetch('/api/audit-logs?limit=30'),
            ])

            setRequests(Array.isArray(prs) ? prs : [])
            setPos(Array.isArray(purchaseOrders) ? purchaseOrders : [])
            setAudit(Array.isArray(logs) ? logs : [])
        } catch (e) {
            setDataError(e?.message || 'Failed to load records')
            setRequests([])
            setPos([])
            setAudit([])
        } finally {
            setDataLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRecords()
    }, [loadRecords])

    async function onArchiveRequest(id) {
        try {
            setDataError('')
            await apiFetch(`/api/purchase-requests/${id}/flags`, {
                method: 'PATCH',
                body: { archived: true },
            })
            await loadRecords()
        } catch (e) {
            setDataError(e?.message || 'Failed to archive request')
            throw e
        }
    }

    async function onDeleteRequest(id) {
        try {
            setDataError('')
            await apiFetch(`/api/purchase-requests/${id}/flags`, {
                method: 'PATCH',
                body: { deleted: true },
            })
            await loadRecords()
        } catch (e) {
            setDataError(e?.message || 'Failed to delete request')
            throw e
        }
    }

    async function onArchivePo(id) {
        try {
            setDataError('')
            await apiFetch(`/api/purchase-orders/${id}/flags`, {
                method: 'PATCH',
                body: { archived: true },
            })
            await loadRecords()
        } catch (e) {
            setDataError(e?.message || 'Failed to archive purchase order')
            throw e
        }
    }

    async function onDeletePo(id) {
        try {
            setDataError('')
            await apiFetch(`/api/purchase-orders/${id}/flags`, {
                method: 'PATCH',
                body: { deleted: true },
            })
            await loadRecords()
        } catch (e) {
            setDataError(e?.message || 'Failed to delete purchase order')
            throw e
        }
    }

    async function loadDepartments() {
        setDeptError('')
        setDeptLoading(true)
        try {
            const data = await apiFetch('/api/departments')

            setDeptRows(Array.isArray(data.departments) ? data.departments : [])
            if (!userDeptId && Array.isArray(data.departments) && data.departments[0]?.dept_id) {
                setUserDeptId(String(data.departments[0].dept_id))
            }
        } catch (err) {
            setDeptError(err?.message || 'Failed to load departments')
        } finally {
            setDeptLoading(false)
        }
    }

    async function createDepartment() {
        setDeptError('')
        setDeptLoading(true)
        try {
            await apiFetch('/api/departments', {
                method: 'POST',
                body: { dept_name: deptName.trim() },
            })

            setDeptName('')
            await loadDepartments()
            return true
        } catch (err) {
            setDeptError(err?.message || 'Failed to create department')
            setDeptLoading(false)
            throw err
        }
    }

    async function createUser() {
        setUserError('')
        setUserLoading(true)

        try {
            const payload = {
                user_name: userName.trim(),
                email: userEmail.trim(),
                role: userRole,
                password: userPassword,
                dept_id: Number(userDeptId),
            }

            const data = await apiFetch('/api/users', {
                method: 'POST',
                body: payload,
            })

            setUserName('')
            setUserEmail('')
            setUserPassword('')

            return data
        } catch (err) {
            setUserError(err?.message || 'Failed to create user')
            throw err
        } finally {
            setUserLoading(false)
        }
    }

    return (
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>View / Archive / Delete History</CardTitle>
                    <CardDescription>Maintain records stored in the database.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {dataLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
                    {dataError ? <div className="text-sm text-destructive">{dataError}</div> : null}
                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Add Accounts (Admin)</div>
                        <div className="rounded-md border p-3">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="text-sm font-medium">Departments</div>
                                            <div className="text-xs text-muted-foreground">
                                                Load or create departments (required before creating users).
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={loadDepartments} disabled={deptLoading}>
                                            {deptLoading ? 'Loading…' : 'Refresh'}
                                        </Button>
                                    </div>

                                    {deptError ? (
                                        <div className="rounded-md border p-3 text-sm">
                                            <div className="font-medium">Department error</div>
                                            <div className="text-muted-foreground">{deptError}</div>
                                        </div>
                                    ) : null}

                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="New department name" disabled={deptLoading} />
                                        <ConfirmActionDialog
                                            title="Create this department?"
                                            description="This will add a new department to the system."
                                            confirmText="Create"
                                            successMessage="Department created."
                                            onConfirm={createDepartment}
                                        >
                                            <Button type="button" disabled={deptLoading || !deptName.trim()}>
                                                Create Department
                                            </Button>
                                        </ConfirmActionDialog>
                                        <div className="text-sm text-muted-foreground md:text-right">
                                            Total: {deptRows.length}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="text-sm font-medium">Create User Account</div>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <div className="text-xs text-muted-foreground">Name</div>
                                            <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name" disabled={userLoading} />
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="text-xs text-muted-foreground">Email</div>
                                            <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@hospital.gov" disabled={userLoading} />
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="text-xs text-muted-foreground">Password</div>
                                            <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" disabled={userLoading} />
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="text-xs text-muted-foreground">Department</div>
                                            <select
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={userDeptId}
                                                onChange={(e) => setUserDeptId(e.target.value)}
                                                disabled={userLoading}
                                            >
                                                {deptRows.length === 0 ? (
                                                    <option value="">(Click Refresh to load departments)</option>
                                                ) : (
                                                    deptRows.map((d) => (
                                                        <option key={d.dept_id} value={String(d.dept_id)}>
                                                            {d.dept_name} (#{d.dept_id})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="text-xs text-muted-foreground">Role</div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {['Department User', 'Admin'].map((r) => (
                                                <label key={r} className="flex cursor-pointer items-center gap-3 rounded-md border p-3">
                                                    <input type="radio" name="role" value={r} checked={userRole === r} onChange={() => setUserRole(r)} disabled={userLoading} />
                                                    <span className="text-sm">{r}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {userError ? (
                                        <div className="rounded-md border p-3 text-sm">
                                            <div className="font-medium">User error</div>
                                            <div className="text-muted-foreground">{userError}</div>
                                        </div>
                                    ) : null}

                                    <div className="flex flex-wrap gap-2">
                                        <ConfirmActionDialog
                                            title="Create this user account?"
                                            description="This will create a new user and allow them to sign in."
                                            confirmText="Create"
                                            successMessage={(data) => `User created: ${data?.user?.email || userEmail.trim()}`}
                                            onConfirm={createUser}
                                        >
                                            <Button
                                                type="button"
                                                disabled={
                                                    userLoading ||
                                                    !userName.trim() ||
                                                    !userEmail.trim() ||
                                                    !userPassword.trim() ||
                                                    !userDeptId
                                                }
                                            >
                                                {userLoading ? 'Creating…' : 'Create User'}
                                            </Button>
                                        </ConfirmActionDialog>
                                        <Button type="button" variant="outline" onClick={loadDepartments} disabled={deptLoading}>
                                            Load Departments
                                        </Button>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        Tip: Click “Load Departments” first. You must be signed in as Admin and the backend must be running.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Requests</div>
                        {!dataLoading && activeRequests.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No requests yet.</div>
                        ) : null}
                        {activeRequests.length > 0 ? (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left">
                                            <th className="p-3">PR #</th>
                                            <th className="p-3">Requester</th>
                                            <th className="p-3">Updated</th>
                                            <th className="p-3">Total</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeRequests.map((r) => (
                                            <tr key={r.id} className="border-b last:border-b-0">
                                                <td className="p-3 font-medium">{r.prNumber}</td>
                                                <td className="p-3">{r.requesterEmail}</td>
                                                <td className="p-3">{formatDate(r.updatedAt || r.updated_at)}</td>
                                                <td className="p-3">{formatMoney(r.totalAmount)}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                                                        {r.archived ? <Badge variant="outline">Archived</Badge> : null}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link to={`/admin/requests/${r.id}`}>View</Link>
                                                        </Button>
                                                        <ConfirmActionDialog
                                                            title="Archive this request?"
                                                            description="This request will be marked as archived."
                                                            confirmText="Archive"
                                                            successMessage="Request archived."
                                                            onConfirm={() => onArchiveRequest(r.id)}
                                                        >
                                                            <Button type="button" size="sm" variant="secondary" disabled={r.archived}>
                                                                Archive
                                                            </Button>
                                                        </ConfirmActionDialog>
                                                        <ConfirmActionDialog
                                                            title="Delete this request?"
                                                            description="This will mark the request as deleted."
                                                            confirmText="Delete"
                                                            confirmVariant="destructive"
                                                            successMessage="Request deleted."
                                                            onConfirm={() => onDeleteRequest(r.id)}
                                                        >
                                                            <Button type="button" size="sm" variant="destructive">
                                                                Delete
                                                            </Button>
                                                        </ConfirmActionDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Purchase Orders</div>
                        {!dataLoading && activePos.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No purchase orders yet.</div>
                        ) : null}
                        {activePos.length > 0 ? (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left">
                                            <th className="p-3">PO #</th>
                                            <th className="p-3">Supplier</th>
                                            <th className="p-3">Issued</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activePos.map((po) => (
                                            <tr key={po.id} className="border-b last:border-b-0">
                                                <td className="p-3 font-medium">{po.poNumber}</td>
                                                <td className="p-3">{po.supplierName}</td>
                                                <td className="p-3">{formatDate(po.issueDate)}</td>
                                                <td className="p-3">{formatMoney(po.amount)}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge variant={statusVariant(po.status)}>{po.status}</Badge>
                                                        {po.archived ? <Badge variant="outline">Archived</Badge> : null}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link to={`/admin/requests/${po.prId}`}>View Request</Link>
                                                        </Button>
                                                        <ConfirmActionDialog
                                                            title="Archive this purchase order?"
                                                            description="This purchase order will be marked as archived."
                                                            confirmText="Archive"
                                                            successMessage="Purchase order archived."
                                                            onConfirm={() => onArchivePo(po.id)}
                                                        >
                                                            <Button type="button" size="sm" variant="secondary" disabled={po.archived}>
                                                                Archive
                                                            </Button>
                                                        </ConfirmActionDialog>
                                                        <ConfirmActionDialog
                                                            title="Delete this purchase order?"
                                                            description="This will mark the purchase order as deleted."
                                                            confirmText="Delete"
                                                            confirmVariant="destructive"
                                                            successMessage="Purchase order deleted."
                                                            onConfirm={() => onDeletePo(po.id)}
                                                        >
                                                            <Button type="button" size="sm" variant="destructive">
                                                                Delete
                                                            </Button>
                                                        </ConfirmActionDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Deleted Records</div>
                        {deletedRequests.length === 0 && deletedPos.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Nothing deleted yet.</div>
                        ) : (
                            <div className="grid gap-2 text-sm text-muted-foreground">
                                {deletedRequests.length ? <div>Deleted requests: {deletedRequests.length}</div> : null}
                                {deletedPos.length ? <div>Deleted purchase orders: {deletedPos.length}</div> : null}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Recent Audit Logs</div>
                        {audit.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No audit logs yet.</div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left">
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Actor</th>
                                            <th className="p-3">Action</th>
                                            <th className="p-3">Entity</th>
                                            <th className="p-3">Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audit.map((l) => (
                                            <tr key={l.id} className="border-b last:border-b-0">
                                                <td className="p-3">{formatDate(l.timestamp)}</td>
                                                <td className="p-3">{l.userEmail || '-'}</td>
                                                <td className="p-3">{l.actionType}</td>
                                                <td className="p-3">
                                                    {l.prId ? 'PR' : l.poId ? 'PO' : '-'}
                                                </td>
                                                <td className="p-3">{String(l.newValue ?? '')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
