export default function Separator() {
    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">Section 1</h1>
            <p>Some content here...</p>

            <hr className="my-6 border-gray-300" /> {/* 👈 separator */}

            <h1 className="text-xl font-bold">Section 2</h1>
            <p>More content below the separator.</p>
        </div>
    );
}
