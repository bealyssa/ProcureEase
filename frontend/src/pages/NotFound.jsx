import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container flex min-h-screen items-center justify-center py-10">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Page not found</CardTitle>
                        <CardDescription>The page you requested does not exist.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link to="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
