import React from 'react'

export default function StatusIcon({isOk}) {
    return (
        <svg className={`svg___connection-status svg___connection-status-${isOk ? "ok" : "not-ok" }`} height="12" width="12">
            <circle cx="6" cy="6" r="6" />
        </svg>
    )
}
