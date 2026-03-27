import { useState, useEffect } from 'react'

interface AnimatedCounterProps {
    value: number
    suffix?: string
    prefix?: string
}

export default function AnimatedCounter({ value, suffix = '', prefix = '' }: AnimatedCounterProps) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const duration = 1000
        const steps = 30
        const increment = value / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= value) {
                setCount(value)
                clearInterval(timer)
            } else {
                setCount(Math.floor(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [value])

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>
}
