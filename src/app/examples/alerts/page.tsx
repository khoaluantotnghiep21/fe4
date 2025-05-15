import AlertExamples from '@/components/examples/AlertExamples';
import ApiErrorExample from '@/components/examples/ApiErrorExample';

export default function AlertExamplesPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Ant Design Alert Examples</h1>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Basic Alerts</h2>
                <AlertExamples />
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">API Error Alerts</h2>
                <ApiErrorExample />
            </div>
        </div>
    );
} 