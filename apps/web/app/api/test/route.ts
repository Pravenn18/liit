// apps/web/app/api/test/route.js
export async function GET() {
    return new Response(JSON.stringify({ message: 'Hello from the test API!' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
