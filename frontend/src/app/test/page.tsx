'use client'

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Frontend Test Page</h1>
      <p>If you can see this, the basic Next.js setup is working!</p>
      <div className="mt-4 space-y-2">
        <p>Environment check:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Next.js 15: ✓</li>
          <li>TypeScript: ✓</li>
          <li>Tailwind CSS: ✓</li>
          <li>Component system: ✓</li>
        </ul>
      </div>
    </div>
  )
}