import { useState } from 'react'

function StarRating({ average, count, onRate, readonly = false }) {
    const [hovered, setHovered] = useState(null)
    
    function renderStar(position) {
        const filled = average || 0
        const isHovered = hovered !== null

        const displayValue = isHovered ? hovered : filled
        const isFull  = displayValue >= position
        const isHalf  = !isFull && displayValue >= position - 0.5

        return (
            <span
                key={position}
                className="relative inline-block text-xl cursor-pointer"
                onMouseEnter={() => !readonly && setHovered(position)}
                onMouseLeave={() => !readonly && setHovered(null)}
                onClick={() => !readonly && onRate && onRate(position)}
            >
                {/* Empty star base */}
                <span className="text-gray-200">★</span>

                {/* Filled overlay */}
                {(isFull || isHalf) && (
                    <span
                        className="absolute inset-0 text-yellow-400 overflow-hidden"
                        style={{ width: isFull ? '100%' : '50%' }}
                    >
                        ★
                    </span>
                )}
            </span>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(position => renderStar(position))}
            </div>
            {average && (
                <span className="text-xs text-gray-400">
                    {/*average*/}
                </span>
            )}
        </div>
    )
}

export default StarRating