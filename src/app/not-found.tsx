import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-braun-bg text-braun-text">
            <h2 className="text-3xl font-bold mb-4">Not Found</h2>
            <p className="mb-6 text-gray-600">Could not find requested resource</p>
            <Link
                href="/"
                className="px-6 py-3 bg-braun-accent text-white rounded-full hover:bg-orange-700 transition-colors"
            >
                Return Home
            </Link>
        </div>
    )
}
