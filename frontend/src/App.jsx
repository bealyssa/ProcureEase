import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function App() {
    return (
        <div className="min-h-screen">
            <div className="container py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>ProcureEase</CardTitle>
                        <CardDescription>
                            UI scaffold is ready (Vite + React + Tailwind + shadcn).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button type="button">Create Purchase Request</Button>
                        <Button type="button" variant="outline">
                            View Tracking
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
